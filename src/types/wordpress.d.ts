/**
 * Packages that ship without type declarations.
 */
declare module '@wordpress/block-editor';
declare module '@wordpress/block-library';

/**
 * Stylesheets imported for their side effect; webpack extracts them to build/.
 */
declare module '*.scss';
