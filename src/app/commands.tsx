/**
 * ⌘K commands in core's command palette: find a page by title, create a page
 * or a subpage, pin the open page, open the trash or settings, and show or
 * hide the sidebar.
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	cog,
	drawerLeft,
	page as pageIcon,
	plus,
	starEmpty,
	starFilled,
	trash,
} from '@wordpress/icons';

import { config, MAX_DEPTH } from './config';
import { useSidebar } from './sidebar/use-sidebar';
import { store as workspaceStore, type TreePage } from './store';
import { store as prefsStore } from './store/prefs';
import { store as uiStore } from './store/ui';
import { ancestorsOf, levelOf } from './tree-utils';
import { useCreatePage } from './use-create-page';
import { navigateTo } from './use-page-route';

const MAX_RESULTS = 10;

interface WorkspaceCommandsProps {
	currentId: number;
	onOpen: ( pageId: number ) => void;
}

/**
 * Registers the commands while the workspace is open.
 *
 * @param props           Props.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 */
export function WorkspaceCommands( {
	currentId,
	onOpen,
}: WorkspaceCommandsProps ) {
	const createPage = useCreatePage( onOpen );
	const sidebar = useSidebar();
	const { openDialog } = useDispatch( uiStore );
	const { togglePin } = useDispatch( prefsStore );
	const { isPinned, level } = useSelect(
		( select ) => ( {
			isPinned: select( prefsStore )
				.getPrefs()
				.pinned.includes( currentId ),
			level: levelOf(
				currentId,
				select( workspaceStore ).getPages() ?? []
			),
		} ),
		[ currentId ]
	);

	useCommand( {
		name: 'liber/new-page',
		label: __( 'New page', 'liber' ),
		icon: plus,
		disabled: ! config.canCreate,
		callback: ( { close } ) => {
			close();
			createPage();
		},
	} );

	useCommand( {
		name: 'liber/new-subpage',
		label: __( 'New subpage here', 'liber' ),
		icon: plus,
		disabled: ! config.canCreate || ! level || level >= MAX_DEPTH,
		callback: ( { close } ) => {
			close();
			createPage( currentId );
		},
	} );

	useCommand( {
		name: 'liber/toggle-pin',
		label: isPinned
			? __( 'Unpin this page', 'liber' )
			: __( 'Pin this page', 'liber' ),
		icon: isPinned ? starFilled : starEmpty,
		disabled: ! currentId,
		callback: ( { close } ) => {
			close();
			togglePin( currentId );
		},
	} );

	useCommand( {
		name: 'liber/open-trash',
		label: __( 'Open trash', 'liber' ),
		icon: trash,
		disabled: ! config.canCreate,
		callback: ( { close } ) => {
			close();
			openDialog( 'trash' );
		},
	} );

	useCommand( {
		name: 'liber/settings',
		label: __( 'Workspace settings', 'liber' ),
		icon: cog,
		disabled: ! config.canManage,
		callback: ( { close } ) => {
			close();
			openDialog( 'settings' );
		},
	} );

	useCommand( {
		name: 'liber/toggle-sidebar',
		label: __( 'Toggle sidebar', 'liber' ),
		icon: drawerLeft,
		callback: ( { close } ) => {
			close();
			sidebar.setOpen( ! sidebar.isOpen );
		},
	} );

	useCommandLoader( { name: 'liber/pages', hook: usePageCommands } );

	return null;
}

/**
 * Pages whose title contains the search, with their path. Runs inside core's
 * palette, outside the workspace's React tree, so it opens pages by URL.
 *
 * @param props        Props.
 * @param props.search Text typed in the palette.
 */
function usePageCommands( { search }: { search: string } ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages(),
		[]
	);

	const commands = useMemo( () => {
		const term = search.trim().toLowerCase();
		if ( ! pages || ! term ) {
			return [];
		}

		return pages
			.filter( ( page ) =>
				titleOf( page ).toLowerCase().includes( term )
			)
			.slice( 0, MAX_RESULTS )
			.map( ( page ) => {
				const path = ancestorsOf( page.id, pages )
					.reverse()
					.map( ( id ) =>
						titleOf( pages.find( ( item ) => item.id === id )! )
					)
					.join( ' › ' );
				const label = path
					? `${ titleOf( page ) } (${ path })`
					: titleOf( page );

				return {
					name: `liber/page-${ page.id }`,
					label,
					searchLabel: label,
					icon: pageIcon,
					callback: ( { close }: { close: () => void } ) => {
						close();
						navigateTo( page.id );
					},
				};
			} );
	}, [ pages, search ] );

	return { commands, isLoading: ! pages };
}

/**
 * A page's title as text, or "Untitled".
 *
 * @param page Page.
 */
function titleOf( page: TreePage ): string {
	return decodeEntities( page.title ) || __( 'Untitled', 'liber' );
}
