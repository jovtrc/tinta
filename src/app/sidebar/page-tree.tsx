/**
 * The page tree: nested links, collapsible (expanded branches are saved per
 * user, the open page's ancestors included), hover actions (the page menu and
 * add a subpage), the page menu on right click, and drag and drop to move
 * pages.
 */
import {
	DndContext,
	DragOverlay,
	pointerWithin,
	useDraggable,
	useDroppable,
} from '@dnd-kit/core';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	chevronDown,
	chevronRight,
	Icon,
	page as pageIcon,
} from '@wordpress/icons';
import type { MouseEvent, MutableRefObject } from 'react';

import { config, pageUrl } from '../config';
import { store as workspaceStore, type TreePage } from '../store';
import { store as prefsStore } from '../store/prefs';
import { store as uiStore } from '../store/ui';
import { ancestorsOf, groupByParent } from '../tree-utils';
import { useCreatePage } from '../use-create-page';
import { PageActions } from './page-actions';
import { menuPosition } from './page-menu';
import { useTreeDrag, type DropTarget } from './use-tree-drag';

interface TreeState {
	childrenOf: Map< number, TreePage[] >;
	expanded: Set< number >;
	toggle: ( pageId: number ) => void;
	currentId: number;
	onOpen: ( pageId: number ) => void;
	onAddSubpage: ( parent: TreePage ) => void;
	draggedId: number;
	target: DropTarget | null;
	justDropped: MutableRefObject< boolean >;
}

const TreeContext = createContext< TreeState | null >( null );

interface PageTreeProps {
	currentId: number;
	onOpen: ( pageId: number ) => void;
}

/**
 * Renders the whole tree.
 *
 * @param props           Props.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 */
export function PageTree( { currentId, onOpen }: PageTreeProps ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages(),
		[]
	);
	const childrenOf = useMemo( () => groupByParent( pages ?? [] ), [ pages ] );
	const prefs = useSelect(
		( select ) => select( prefsStore ).getPrefs(),
		[]
	);
	const { setExpanded } = useDispatch( prefsStore );
	const expanded = useMemo( () => new Set( prefs.expanded ), [ prefs ] );
	const createPage = useCreatePage( onOpen );
	const expand = ( pageId: number ) => setExpanded( [ pageId ], true );
	const drag = useTreeDrag( pages ?? [], expand );

	useEffect( () => {
		const ancestors = ancestorsOf( currentId, pages ?? [] );
		if ( ancestors.length ) {
			setExpanded( ancestors, true );
		}
	}, [ currentId, pages, setExpanded ] );

	if ( ! pages ) {
		return <Spinner />;
	}

	const toggle = ( pageId: number ) =>
		setExpanded( [ pageId ], ! expanded.has( pageId ) );

	const onAddSubpage = ( parent: TreePage ) => {
		expand( parent.id );
		createPage( parent.id );
	};
	const draggedPage = pages.find( ( page ) => page.id === drag.draggedId );

	return (
		<TreeContext.Provider
			value={ {
				childrenOf,
				expanded,
				toggle,
				currentId,
				onOpen,
				onAddSubpage,
				draggedId: drag.draggedId,
				target: drag.target,
				justDropped: drag.justDropped,
			} }
		>
			<DndContext
				sensors={ drag.sensors }
				collisionDetection={ pointerWithin }
				{ ...drag.handlers }
			>
				<TreeLevel parent={ 0 } depth={ 0 } />
				<DragOverlay dropAnimation={ null }>
					{ draggedPage && (
						<div className="tinta-tree__drag-preview">
							{ decodeEntities( draggedPage.title ) ||
								__( 'Untitled', 'tinta' ) }
						</div>
					) }
				</DragOverlay>
			</DndContext>
		</TreeContext.Provider>
	);
}

/**
 * The children of one page.
 *
 * @param props        Props.
 * @param props.parent Parent page ID.
 * @param props.depth  Nesting depth.
 */
function TreeLevel( { parent, depth }: { parent: number; depth: number } ) {
	const { childrenOf } = useContext( TreeContext )!;

	return (
		<ul
			className="tinta-tree"
			role={ depth ? 'group' : undefined }
			aria-label={ depth ? undefined : __( 'Pages', 'tinta' ) }
		>
			{ ( childrenOf.get( parent ) ?? [] ).map( ( page ) => (
				<TreeItem key={ page.id } page={ page } depth={ depth } />
			) ) }
		</ul>
	);
}

/**
 * One page: expand button, icon and title link, actions, then its children when expanded.
 *
 * @param props       Props.
 * @param props.page  Page.
 * @param props.depth Nesting depth.
 */
function TreeItem( { page, depth }: { page: TreePage; depth: number } ) {
	const {
		childrenOf,
		expanded,
		toggle,
		currentId,
		onOpen,
		onAddSubpage,
		draggedId,
		target,
		justDropped,
	} = useContext( TreeContext )!;
	const draggable = useDraggable( {
		id: page.id,
		disabled: ! config.canCreate,
	} );
	const droppable = useDroppable( { id: page.id } );
	const { openContextMenu } = useDispatch( uiStore );
	const isMenuOpen = useSelect(
		( select ) => select( uiStore ).getContextMenu()?.pageId === page.id,
		[ page.id ]
	);
	const hasChildren = !! childrenOf.get( page.id )?.length;
	const isExpanded = expanded.has( page.id );
	const title = decodeEntities( page.title ) || __( 'Untitled', 'tinta' );

	const rowClass = [
		'tinta-tree__row',
		draggedId === page.id && 'is-dragging',
		target?.id === page.id && `is-drop-${ target.zone }`,
		isMenuOpen && 'is-menu-open',
	]
		.filter( Boolean )
		.join( ' ' );

	const open = ( event: MouseEvent ) => {
		if ( justDropped.current ) {
			event.preventDefault();
		} else if ( ! isModifiedClick( event ) ) {
			event.preventDefault();
			onOpen( page.id );
		}
	};

	return (
		<li>
			<div
				ref={ ( node ) => {
					draggable.setNodeRef( node );
					droppable.setNodeRef( node );
				} }
				className={ rowClass }
				style={ { paddingInlineStart: depth * 12 } }
				{ ...draggable.listeners }
				onContextMenu={ ( event ) => {
					event.preventDefault();
					openContextMenu( page.id, ...menuPosition( event ) );
				} }
			>
				{ hasChildren ? (
					<Button
						className="tinta-tree__toggle"
						size="small"
						icon={ isExpanded ? chevronDown : chevronRight }
						label={
							isExpanded
								? __( 'Collapse', 'tinta' )
								: __( 'Expand', 'tinta' )
						}
						aria-expanded={ isExpanded }
						onClick={ () => toggle( page.id ) }
					/>
				) : (
					<span className="tinta-tree__toggle" />
				) }
				<a
					className="tinta-tree__link"
					href={ pageUrl( page.id ) }
					aria-current={ page.id === currentId ? 'page' : undefined }
					onClick={ open }
				>
					<span className="tinta-tree__icon" aria-hidden="true">
						{ page.icon || <Icon icon={ pageIcon } size={ 18 } /> }
					</span>
					<span className="tinta-tree__title">{ title }</span>
				</a>
				<PageActions
					pageId={ page.id }
					title={ title }
					level={ depth + 1 }
					onAddSubpage={ () => onAddSubpage( page ) }
				/>
			</div>
			{ hasChildren && isExpanded && (
				<TreeLevel parent={ page.id } depth={ depth + 1 } />
			) }
		</li>
	);
}

/**
 * Whether the click should keep the browser's own behaviour (new tab, new window).
 *
 * @param event Click event.
 */
function isModifiedClick( event: MouseEvent ): boolean {
	return (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	);
}
