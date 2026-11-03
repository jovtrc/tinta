/**
 * The trash: pages moved there, each with its subpages. Restore brings them
 * back; administrators can also delete them for good.
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';

import { config } from '../config';
import { store as workspaceStore } from '../store';

interface TrashedPage {
	id: number;
	parent: number;
	title: { raw: string };
}

/**
 * Renders the dialog.
 *
 * @param props         Props.
 * @param props.onClose Closes the dialog.
 */
export function TrashDialog( { onClose }: { onClose: () => void } ) {
	const [ pages, setPages ] = useState< TrashedPage[] | null >( null );
	const [ confirmingId, setConfirmingId ] = useState( 0 );
	const { refreshPages } = useDispatch( workspaceStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const load = useCallback(
		() =>
			apiFetch< TrashedPage[] >( {
				path: addQueryArgs( '/wp/v2/liber-docs', {
					status: 'trash',
					context: 'edit',
					per_page: 100,
					_fields: 'id,parent,title',
				} ),
			} ).then( setPages ),
		[]
	);

	useEffect( () => {
		load();
	}, [ load ] );

	const run = async ( request: Promise< unknown >, failure: string ) => {
		try {
			await request;
			refreshPages();
			await load();
		} catch {
			createErrorNotice( failure, { type: 'snackbar' } );
		}
	};

	const restore = ( id: number ) =>
		run(
			apiFetch( {
				path: `/liber/v1/docs/${ id }/restore`,
				method: 'POST',
			} ),
			__( 'The page could not be restored.', 'liber' )
		);

	const destroy = ( id: number ) =>
		run(
			apiFetch( {
				path: `/wp/v2/liber-docs/${ id }?force=true`,
				method: 'DELETE',
			} ),
			__( 'The page could not be deleted.', 'liber' )
		);

	const roots = pages?.filter(
		( page ) => ! pages.some( ( other ) => other.id === page.parent )
	);

	return (
		<Modal
			title={ __( 'Trash', 'liber' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<p className="liber-dialog__note">
				{ __(
					'Subpages come back with their page. Pages in the trash are deleted after 30 days.',
					'liber'
				) }
			</p>
			{ ! roots && <Spinner /> }
			{ roots && ! roots.length && (
				<p>{ __( 'The trash is empty.', 'liber' ) }</p>
			) }
			{ !! roots?.length && (
				<ul className="liber-trash">
					{ roots.map( ( page ) => (
						<li key={ page.id } className="liber-trash__item">
							<span className="liber-trash__title">
								{ decodeEntities( page.title.raw ) ||
									__( 'Untitled', 'liber' ) }
							</span>
							{ confirmingId === page.id ? (
								<>
									<Button
										size="compact"
										variant="primary"
										isDestructive
										onClick={ () => destroy( page.id ) }
									>
										{ __( 'Delete forever', 'liber' ) }
									</Button>
									<Button
										size="compact"
										variant="tertiary"
										onClick={ () => setConfirmingId( 0 ) }
									>
										{ __( 'Cancel', 'liber' ) }
									</Button>
								</>
							) : (
								<>
									<Button
										size="compact"
										variant="secondary"
										onClick={ () => restore( page.id ) }
									>
										{ __( 'Restore', 'liber' ) }
									</Button>
									{ config.canManage && (
										<Button
											size="compact"
											variant="tertiary"
											isDestructive
											onClick={ () =>
												setConfirmingId( page.id )
											}
										>
											{ __( 'Delete…', 'liber' ) }
										</Button>
									) }
								</>
							) }
						</li>
					) ) }
				</ul>
			) }
		</Modal>
	);
}
