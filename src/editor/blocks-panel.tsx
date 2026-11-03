/**
 * Every block you can add, beside the page: opened by "Browse all" in the
 * quick inserter, as core's editor opens its block library. Search, then pick
 * a block; it goes after the selected block, or replaces an empty paragraph.
 */
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	isUnmodifiedDefaultBlock,
	store as blocksStore,
} from '@wordpress/blocks';
import { Button, SearchControl } from '@wordpress/components';
import {
	useFocusOnMount,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import type { FormEvent } from 'react';

interface InserterItem {
	id: string;
	name: string;
	title: string;
	description?: string;
	icon: unknown;
	category: string;
	keywords?: string[];
	isDisabled?: boolean;
	initialAttributes?: Record< string, unknown >;
	innerBlocks?: Parameters< typeof createBlocksFromInnerBlocksTemplate >[ 0 ];
}

interface BlockSelectors {
	getBlockInsertionPoint: () => { rootClientId?: string; index: number };
	getInserterItems: ( rootClientId?: string ) => InserterItem[];
}

/**
 * Renders the panel.
 */
export function BlocksPanel() {
	const [ search, setSearch ] = useState( '' );
	const { setIsInserterOpened } = useDispatch( editorStore );
	const { insertBlock, replaceBlock } = useDispatch( blockEditorStore );
	const { getBlockInsertionPoint, getSelectedBlock } =
		useSelect( blockEditorStore );
	const { items, categories } = useSelect( ( select ) => {
		const { getBlockInsertionPoint: insertionPoint, getInserterItems } =
			select( blockEditorStore ) as unknown as BlockSelectors;

		return {
			items: getInserterItems( insertionPoint().rootClientId ),
			categories: select( blocksStore ).getCategories(),
		};
	}, [] );

	const close = useCallback(
		() => setIsInserterOpened( false ),
		[ setIsInserterOpened ]
	);

	useEffect(
		() => () => {
			close();
		},
		[ close ]
	);

	const closeOnEscape = useRefEffect(
		( node: HTMLElement ) => {
			const onKeyDown = ( event: KeyboardEvent ) => {
				if ( event.key === 'Escape' && ! event.defaultPrevented ) {
					event.preventDefault();
					close();
				}
			};

			node.addEventListener( 'keydown', onKeyDown );

			return () => node.removeEventListener( 'keydown', onKeyDown );
		},
		[ close ]
	);
	const ref = useMergeRefs( [
		useFocusOnMount( 'firstElement' ),
		closeOnEscape,
	] );

	const term = search.trim().toLowerCase();
	const found = items.filter(
		( item ) =>
			! item.isDisabled &&
			[ item.title, ...( item.keywords ?? [] ) ].some( ( text ) =>
				text.toLowerCase().includes( term )
			)
	);
	const groups = categories
		.map( ( category ) => ( {
			...category,
			items: found.filter( ( item ) => item.category === category.slug ),
		} ) )
		.filter( ( group ) => group.items.length );

	const insert = ( item: InserterItem ) => {
		const block = createBlock(
			item.name,
			item.initialAttributes,
			createBlocksFromInnerBlocksTemplate( item.innerBlocks ?? [] )
		);
		const selected = getSelectedBlock();

		if ( selected && isUnmodifiedDefaultBlock( selected ) ) {
			replaceBlock( selected.clientId, block );
		} else {
			const { index, rootClientId } = getBlockInsertionPoint();
			insertBlock( block, index, rootClientId );
		}

		close();
	};

	const insertFirst = ( event: FormEvent ) => {
		event.preventDefault();
		if ( groups.length ) {
			insert( groups[ 0 ].items[ 0 ] );
		}
	};

	return (
		<aside
			ref={ ref }
			className="tinta-blocks"
			aria-label={ __( 'Blocks', 'tinta' ) }
		>
			<form className="tinta-blocks__header" onSubmit={ insertFirst }>
				<SearchControl
					__nextHasNoMarginBottom
					label={ __( 'Search blocks', 'tinta' ) }
					value={ search }
					onChange={ setSearch }
				/>
				<Button
					icon={ closeSmall }
					label={ __( 'Close blocks', 'tinta' ) }
					size="compact"
					onClick={ close }
				/>
			</form>
			{ groups.map( ( group ) => (
				<section key={ group.slug }>
					<h2 className="tinta-blocks__group">{ group.title }</h2>
					<ul className="tinta-blocks__list">
						{ group.items.map( ( item ) => (
							<li key={ item.id }>
								<Button
									className="tinta-blocks__item"
									onClick={ () => insert( item ) }
								>
									<BlockIcon icon={ item.icon } showColors />
									<span className="tinta-blocks__text">
										<span className="tinta-blocks__title">
											{ item.title }
										</span>
										{ item.description && (
											<span className="tinta-blocks__description">
												{ item.description }
											</span>
										) }
									</span>
								</Button>
							</li>
						) ) }
					</ul>
				</section>
			) ) }
			{ ! groups.length && (
				<p className="tinta-blocks__empty">
					{ __( 'No blocks found.', 'tinta' ) }
				</p>
			) }
		</aside>
	);
}
