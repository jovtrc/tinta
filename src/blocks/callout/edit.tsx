/**
 * Callout block in the editor: the emoji opens the picker; the text is nested
 * blocks, selected as soon as the block is inserted (like core's Quote). The
 * text comes first in the DOM, so it gets focus before the emoji button; CSS
 * shows the emoji first.
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { EmojiPicker } from '../../editor/emoji-picker';

const TEMPLATE = [
	[ 'core/paragraph', { placeholder: __( 'Write a note…', 'liber' ) } ],
];

interface EditProps {
	attributes: { emoji: string };
	setAttributes: ( attributes: { emoji: string } ) => void;
}

/**
 * Renders the callout in the editor.
 *
 * @param props               Props.
 * @param props.attributes    Block attributes.
 * @param props.setAttributes Updates attributes.
 */
export function Edit( { attributes, setAttributes }: EditProps ) {
	const { emoji } = attributes;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-liber-callout__content' },
		{ template: TEMPLATE, templateInsertUpdatesSelection: true }
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			<Dropdown
				className="wp-block-liber-callout__emoji-dropdown"
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button
						type="button"
						className="wp-block-liber-callout__emoji"
						aria-label={ __( 'Change emoji', 'liber' ) }
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ emoji }
					</button>
				) }
				renderContent={ ( { onClose } ) => (
					<EmojiPicker
						hasIcon={ false }
						onSelect={ ( value ) => {
							setAttributes( { emoji: value } );
							onClose();
						} }
						onRemove={ onClose }
					/>
				) }
			/>
		</div>
	);
}
