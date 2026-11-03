/**
 * ⌘K commands in core's command palette: find a page by title, create a page,
 * open the trash.
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { page as pageIcon, plus, trash } from '@wordpress/icons';

import { config } from './config';
import { store as workspaceStore, type TreePage } from './store';
import { ancestorsOf } from './tree-utils';
import { useCreatePage } from './use-create-page';
import { navigateTo } from './use-page-route';

const MAX_RESULTS = 10;

interface WorkspaceCommandsProps {
	onOpen: ( pageId: number ) => void;
	onOpenTrash: () => void;
}

/**
 * Registers the commands while the workspace is open.
 *
 * @param props             Props.
 * @param props.onOpen      Opens a page.
 * @param props.onOpenTrash Opens the trash.
 */
export function WorkspaceCommands( {
	onOpen,
	onOpenTrash,
}: WorkspaceCommandsProps ) {
	const createPage = useCreatePage( onOpen );

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
		name: 'liber/open-trash',
		label: __( 'Open trash', 'liber' ),
		icon: trash,
		disabled: ! config.canCreate,
		callback: ( { close } ) => {
			close();
			onOpenTrash();
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
