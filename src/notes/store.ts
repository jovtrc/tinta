/**
 * `liber/notes` store: whether the Notes panel is open, and which block a new
 * note is being written for.
 */
import { createReduxStore, register } from '@wordpress/data';

interface State {
	isOpen: boolean;
	composingFor: string | null;
}

type Action =
	| { type: 'SET_OPEN'; isOpen: boolean }
	| { type: 'START_NOTE'; clientId: string | null };

const actions = {
	setOpen: ( isOpen: boolean ): Action => ( { type: 'SET_OPEN', isOpen } ),

	/**
	 * Opens the panel with a new note for a block; null stops writing it.
	 *
	 * @param clientId Block the note is for.
	 */
	startNote: ( clientId: string | null ): Action => ( {
		type: 'START_NOTE',
		clientId,
	} ),
};

/**
 * Applies an action.
 *
 * @param state  Current state.
 * @param action Action.
 */
function reducer(
	state: State = { isOpen: false, composingFor: null },
	action: Action
): State {
	switch ( action.type ) {
		case 'SET_OPEN':
			return {
				isOpen: action.isOpen,
				composingFor: action.isOpen ? state.composingFor : null,
			};
		case 'START_NOTE':
			return {
				isOpen: state.isOpen || !! action.clientId,
				composingFor: action.clientId,
			};
	}

	return state;
}

const selectors = {
	isOpen: ( state: State ) => state.isOpen,
	getComposingFor: ( state: State ) => state.composingFor,
};

export const store = createReduxStore( 'liber/notes', {
	reducer,
	actions,
	selectors,
} );

register( store );
