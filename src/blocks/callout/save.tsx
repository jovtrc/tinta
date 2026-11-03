/**
 * Callout block markup: the emoji, then the nested blocks.
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

interface SaveProps {
	attributes: { emoji: string };
}

/**
 * Saves the callout.
 *
 * @param props            Props.
 * @param props.attributes Block attributes.
 */
export function save( { attributes }: SaveProps ) {
	const { emoji } = attributes;

	return (
		<div { ...useBlockProps.save() }>
			<span className="wp-block-tinta-callout__emoji" aria-hidden="true">
				{ emoji }
			</span>
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-tinta-callout__content',
				} ) }
			/>
		</div>
	);
}
