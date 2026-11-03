/**
 * The page tree: nested links, collapsible, with the open page's ancestors
 * expanded, and hover actions to add a subpage or move a page to the trash.
 */
import { Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	chevronDown,
	chevronRight,
	Icon,
	page as pageIcon,
} from '@wordpress/icons';
import type { MouseEvent } from 'react';

import { pageUrl } from '../config';
import { store as workspaceStore, type TreePage } from '../store';
import { ancestorsOf, groupByParent } from '../tree-utils';
import { useCreatePage } from '../use-create-page';
import { PageActions } from './page-actions';
import { TrashConfirm } from './trash-confirm';

interface TreeState {
	childrenOf: Map< number, TreePage[] >;
	expanded: Set< number >;
	toggle: ( pageId: number ) => void;
	currentId: number;
	onOpen: ( pageId: number ) => void;
	onAddSubpage: ( parent: TreePage ) => void;
	onTrash: ( page: TreePage ) => void;
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
	const [ expanded, setExpanded ] = useState< Set< number > >(
		() => new Set()
	);
	const [ trashing, setTrashing ] = useState< TreePage | null >( null );
	const createPage = useCreatePage( onOpen );

	useEffect( () => {
		const ancestors = ancestorsOf( currentId, pages ?? [] );
		if ( ancestors.length ) {
			setExpanded( ( open ) => new Set( [ ...open, ...ancestors ] ) );
		}
	}, [ currentId, pages ] );

	if ( ! pages ) {
		return <Spinner />;
	}

	const toggle = ( pageId: number ) =>
		setExpanded( ( open ) => {
			const next = new Set( open );
			if ( ! next.delete( pageId ) ) {
				next.add( pageId );
			}
			return next;
		} );

	const onAddSubpage = ( parent: TreePage ) => {
		setExpanded( ( open ) => new Set( [ ...open, parent.id ] ) );
		createPage( parent.id );
	};

	return (
		<TreeContext.Provider
			value={ {
				childrenOf,
				expanded,
				toggle,
				currentId,
				onOpen,
				onAddSubpage,
				onTrash: setTrashing,
			} }
		>
			<TreeLevel parent={ 0 } depth={ 0 } />
			{ trashing && (
				<TrashConfirm
					page={ trashing }
					currentId={ currentId }
					onOpen={ onOpen }
					onClose={ () => setTrashing( null ) }
				/>
			) }
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
		<ul className="liber-tree" role={ depth ? 'group' : undefined }>
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
		onTrash,
	} = useContext( TreeContext )!;
	const hasChildren = !! childrenOf.get( page.id )?.length;
	const isExpanded = expanded.has( page.id );
	const title = decodeEntities( page.title ) || __( 'Untitled', 'liber' );

	const open = ( event: MouseEvent ) => {
		if ( ! isModifiedClick( event ) ) {
			event.preventDefault();
			onOpen( page.id );
		}
	};

	return (
		<li>
			<div
				className="liber-tree__row"
				style={ { paddingInlineStart: depth * 12 } }
			>
				{ hasChildren ? (
					<Button
						className="liber-tree__toggle"
						size="small"
						icon={ isExpanded ? chevronDown : chevronRight }
						label={
							isExpanded
								? __( 'Collapse', 'liber' )
								: __( 'Expand', 'liber' )
						}
						aria-expanded={ isExpanded }
						onClick={ () => toggle( page.id ) }
					/>
				) : (
					<span className="liber-tree__toggle" />
				) }
				<a
					className="liber-tree__link"
					href={ pageUrl( page.id ) }
					aria-current={ page.id === currentId ? 'page' : undefined }
					onClick={ open }
				>
					<span className="liber-tree__icon" aria-hidden="true">
						{ page.icon || <Icon icon={ pageIcon } size={ 18 } /> }
					</span>
					<span className="liber-tree__title">{ title }</span>
				</a>
				<PageActions
					title={ title }
					level={ depth + 1 }
					onAddSubpage={ () => onAddSubpage( page ) }
					onTrash={ () => onTrash( page ) }
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
