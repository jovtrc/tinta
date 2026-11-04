/**
 * Tinta's mark: a fountain-pen nib drawn as the letter T.
 */

const MARK =
	'M66 51H190A14 14 0 0 1 204 65V77A14 14 0 0 1 190 91H164Q156 91 156 99C156 141 142 177 128 205C114 177 100 141 100 99Q100 91 92 91H66A14 14 0 0 1 52 77V65A14 14 0 0 1 66 51ZM138 121A10 10 0 1 0 118 121A10 10 0 1 0 138 121ZM125.5 130H130.5V189H125.5Z';

/**
 * Renders the mark in the current text color.
 *
 * @param props           Props.
 * @param props.className Class name.
 */
export function Logo( { className }: { className?: string } ) {
	return (
		<svg
			className={ className }
			viewBox="47 47 162 162"
			aria-hidden="true"
			focusable="false"
		>
			<path fill="currentColor" fillRule="evenodd" d={ MARK } />
		</svg>
	);
}
