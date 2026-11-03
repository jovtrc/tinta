/**
 * Page link block in the editor: pick a page, then show its current icon and
 * title, with toolbar buttons to open it or link another page.
 */
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import {
	ComboboxControl,
	Placeholder,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

interface LinkedPage {
	id: number;
	title: { raw: string };
	meta?: { _liber_icon?: string };
}

interface EditProps {
	attributes: { pageId: number };
	setAttributes: ( attributes: { pageId: number } ) => void;
}

/**
 * Renders the block in the editor.
 *
 * @param props               Props.
 * @param props.attributes    Block attributes.
 * @param props.setAttributes Updates attributes.
 */
export function Edit( { attributes, setAttributes }: EditProps ) {
	const { pageId } = attributes;
	const blockProps = useBlockProps();
	const page = useSelect(
		( select ) =>
			pageId
				? ( select( coreStore ).getEntityRecord(
						'postType',
						'liber_doc',
						pageId
					) as LinkedPage | undefined )
				: undefined,
		[ pageId ]
	);

	if ( ! pageId ) {
		return (
			<div { ...blockProps }>
				<PagePicker
					onPick={ ( id ) => setAttributes( { pageId: id } ) }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => openPage( pageId ) }>
						{ __( 'Open', 'liber' ) }
					</ToolbarButton>
					<ToolbarButton
						onClick={ () => setAttributes( { pageId: 0 } ) }
					>
						{ __( 'Link another page', 'liber' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<p { ...blockProps }>
				<span className="wp-block-liber-page-link__link">
					<span
						className="wp-block-liber-page-link__icon"
						aria-hidden="true"
					>
						{ page?.meta?._liber_icon || '📄' }
					</span>
					<span className="wp-block-liber-page-link__title">
						{ decodeEntities( page?.title.raw ?? '' ) ||
							__( 'Untitled', 'liber' ) }
					</span>
				</span>
			</p>
		</>
	);
}

/**
 * Searches pages by title.
 *
 * @param props        Props.
 * @param props.onPick Links the chosen page.
 */
function PagePicker( { onPick }: { onPick: ( pageId: number ) => void } ) {
	const [ search, setSearch ] = useState( '' );
	const pages = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'liber_doc', {
				search,
				status: 'private',
				per_page: 20,
				context: 'edit',
				_fields: 'id,title',
			} ) as LinkedPage[] | null,
		[ search ]
	);

	return (
		<Placeholder
			label={ __( 'Page link', 'liber' ) }
			instructions={ __( 'Choose the page to link to.', 'liber' ) }
		>
			<ComboboxControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Page', 'liber' ) }
				value={ null }
				options={ ( pages ?? [] ).map( ( page ) => ( {
					value: String( page.id ),
					label:
						decodeEntities( page.title.raw ) ||
						__( 'Untitled', 'liber' ),
				} ) ) }
				onFilterValueChange={ setSearch }
				onChange={ ( value ) => value && onPick( Number( value ) ) }
			/>
		</Placeholder>
	);
}

/**
 * Opens a page in the workspace, the way back and forward do.
 *
 * @param pageId Page ID.
 */
function openPage( pageId: number ) {
	const url = new URL( window.location.href );
	url.searchParams.set( 'doc', String( pageId ) );
	window.history.pushState( {}, '', url );
	window.dispatchEvent( new PopStateEvent( 'popstate' ) );
}
