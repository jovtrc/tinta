/**
 * People who can be mentioned in notes (`tinta/v1/people`), loaded once per screen.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

import type { Person } from './data';

let request: Promise< Person[] > | null = null;

/**
 * The people, empty until they load.
 */
export function usePeople(): Person[] {
	const [ people, setPeople ] = useState< Person[] >( [] );

	useEffect( () => {
		request ??= apiFetch< Person[] >( { path: '/tinta/v1/people' } ).catch(
			() => []
		);
		request.then( setPeople );
	}, [] );

	return people;
}
