/**
 * Page icon picker: a filter box, curated emoji by group, any typed or pasted
 * emoji, and a hint for the system picker. Emoji are rendered by the OS. The
 * groups are listboxes in one core Composite: a single Tab stop, and arrow
 * keys move through the rows.
 */
import { Button, Composite, SearchControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { emojiGroups } from './emoji';

const COLUMNS = 8;

interface EmojiPickerProps {
	recent?: string[];
	selected?: string;
	hasIcon: boolean;
	onSelect: ( emoji: string ) => void;
	onRemove: () => void;
}

interface EmojiGroupProps {
	label: string;
	emojis: [ string, string ][];
	selected?: string;
	onSelect: ( emoji: string ) => void;
}

/**
 * Renders the picker.
 *
 * @param props          Props.
 * @param props.recent   Recently used emoji, shown first.
 * @param props.selected The emoji in use.
 * @param props.hasIcon  Whether the page has an icon to remove.
 * @param props.onSelect Sets the icon.
 * @param props.onRemove Removes the icon.
 */
export function EmojiPicker( {
	recent = [],
	selected,
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
			<Composite className="tinta-emoji-picker__groups">
				{ groups.map( ( group ) => (
					<EmojiGroup
						key={ group.label }
						label={ group.label }
						emojis={ group.emojis }
						selected={ selected }
						onSelect={ onSelect }
					/>
				) ) }
			</Composite>
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
 * One group: its heading, then a listbox of emoji in rows.
 *
 * @param props          Props.
 * @param props.label    Group name.
 * @param props.emojis   Emoji and the words that find them.
 * @param props.selected The emoji in use.
 * @param props.onSelect Picks an emoji.
 */
function EmojiGroup( { label, emojis, selected, onSelect }: EmojiGroupProps ) {
	const labelId = useInstanceId( EmojiGroup, 'tinta-emoji-group' );
	const rows = Array.from(
		{ length: Math.ceil( emojis.length / COLUMNS ) },
		( _, row ) => emojis.slice( row * COLUMNS, ( row + 1 ) * COLUMNS )
	);

	return (
		<div>
			<h3 id={ labelId } className="tinta-emoji-picker__group">
				{ label }
			</h3>
			<div role="listbox" aria-labelledby={ labelId }>
				{ rows.map( ( row, index ) => (
					<Composite.Row
						key={ index }
						role="presentation"
						className="tinta-emoji-picker__grid"
					>
						{ row.map( ( [ emoji, words ] ) => (
							<Composite.Item
								key={ emoji }
								role="option"
								aria-selected={ emoji === selected }
								aria-label={ words }
								className="tinta-emoji-picker__emoji"
								onClick={ () => onSelect( emoji ) }
								render={ <Button /> }
							>
								{ emoji }
							</Composite.Item>
						) ) }
					</Composite.Row>
				) ) }
			</div>
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
