/**
 * Page icon picker: a filter box, curated emoji by group, any typed or pasted
 * emoji, and a hint for the system picker. Emoji are rendered by the OS.
 */
import { Button, SearchControl } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { emojiGroups } from './emoji';

interface EmojiPickerProps {
	recent?: string[];
	hasIcon: boolean;
	onSelect: ( emoji: string ) => void;
	onRemove: () => void;
}

/**
 * Renders the picker.
 *
 * @param props          Props.
 * @param props.recent   Recently used emoji, shown first.
 * @param props.hasIcon  Whether the page has an icon to remove.
 * @param props.onSelect Sets the icon.
 * @param props.onRemove Removes the icon.
 */
export function EmojiPicker( {
	recent = [],
	hasIcon,
	onSelect,
	onRemove,
}: EmojiPickerProps ) {
	const [ filter, setFilter ] = useState( '' );
	const typed = firstEmoji( filter );
	const groups = useMemo( () => {
		const term = filter.trim().toLowerCase();

		const recentGroup = {
			label: __( 'Recently used', 'tinta' ),
			emojis: recent.map( ( emoji ): [ string, string ] => [
				emoji,
				emoji,
			] ),
		};

		return [ ...( term ? [] : [ recentGroup ] ), ...emojiGroups() ]
			.map( ( group ) => ( {
				...group,
				emojis: group.emojis.filter(
					( [ emoji, words ] ) =>
						! term || words.includes( term ) || emoji === term
				),
			} ) )
			.filter( ( group ) => group.emojis.length );
	}, [ filter, recent ] );

	return (
		<div className="tinta-emoji-picker">
			<SearchControl
				__nextHasNoMarginBottom
				label={ __( 'Filter emoji', 'tinta' ) }
				placeholder={ __( 'Filter, or type any emoji', 'tinta' ) }
				value={ filter }
				onChange={ setFilter }
			/>
			{ typed && (
				<Button variant="secondary" onClick={ () => onSelect( typed ) }>
					{
						/* translators: %s: an emoji. */
						sprintf( __( 'Use %s', 'tinta' ), typed )
					}
				</Button>
			) }
			{ groups.map( ( group ) => (
				<div key={ group.label }>
					<h3 className="tinta-emoji-picker__group">
						{ group.label }
					</h3>
					<div className="tinta-emoji-picker__grid">
						{ group.emojis.map( ( [ emoji, words ] ) => (
							<Button
								key={ emoji }
								className="tinta-emoji-picker__emoji"
								aria-label={ words }
								onClick={ () => onSelect( emoji ) }
							>
								{ emoji }
							</Button>
						) ) }
					</div>
				</div>
			) ) }
			<p className="tinta-emoji-picker__hint">
				{ __(
					'More emoji: ⌃⌘Space on a Mac, Windows + . on Windows.',
					'tinta'
				) }
			</p>
			{ hasIcon && (
				<Button variant="tertiary" isDestructive onClick={ onRemove }>
					{ __( 'Remove icon', 'tinta' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * The first emoji in a text, if it starts with one.
 *
 * @param text Typed text.
 */
function firstEmoji( text: string ): string {
	const [ first ] = new Intl.Segmenter().segment( text.trim() );

	return first && /\p{Extended_Pictographic}/u.test( first.segment )
		? first.segment
		: '';
}
