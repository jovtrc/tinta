/**
 * Fills the workspace with a small studio's pages, people and notes, then
 * takes the wordpress.org screenshots into `.wordpress-org/`, in workspace
 * mode: `screenshot-N.png` in English, `screenshot-N-pt_BR.png` in Brazilian
 * Portuguese (one Playwright project per locale). Captions are in readme.txt's
 * Screenshots section, in the same order.
 */
import {
	expect,
	RequestUtils,
	test,
	type Admin,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

const OUT = '.wordpress-org';

/**
 * Password for the people this script creates on the disposable Playground site.
 */
const PASSWORD = 'tinta-screenshots-password';

type BlockSpec = [ string, Record< string, unknown >?, BlockSpec[]? ];

interface Block {
	attributes: Record< string, unknown >;
}

/**
 * The WordPress scripts the workspace screen loads, as page globals.
 */
interface WpGlobals {
	apiFetch: < T = unknown >( options: object ) => Promise< T >;
	blocks: {
		createBlock: (
			name: string,
			attributes: Record< string, unknown >,
			inner: Block[]
		) => Block;
		serialize: ( blocks: Block[] ) => string;
	};
}

type Locale = 'en' | 'pt_BR';

/**
 * Everything the screenshots show or look for, in one locale.
 */
interface Copy {
	workspace: string;
	pages: PageSpec[];
	deploys: BlockSpec[];
	onboarding: ( ids: Record< string, number > ) => BlockSpec[];
	notes: [ string, ( mention: string ) => string, string ];
	search: string;
	ui: {
		untitled: string;
		notesOnBlock: RegExp;
		notes: string;
		setup: string;
		skip: string;
		openSidebar: string;
	};
}

interface PageSpec {
	key: string;
	title: string;
	icon: string;
	parent?: string;
	blocks?: BlockSpec[];
}

const p = ( content: string ): BlockSpec => [ 'core/paragraph', { content } ];
const h = ( content: string ): BlockSpec => [
	'core/heading',
	{ level: 2, content },
];
const list = ( items: string[] ): BlockSpec => [
	'core/list',
	{},
	items.map( ( content ) => [ 'core/list-item', { content } ] ),
];

/**
 * The onboarding page most screenshots show. The first paragraph carries the
 * notes.
 *
 * @param text           Its text.
 * @param text.intro
 * @param text.buddy
 * @param text.week
 * @param text.weekItems
 * @param text.ask
 * @param text.askHead
 * @param text.askRows
 * @param text.next
 */
function onboardingPage( text: {
	intro: string;
	buddy: string;
	week: string;
	weekItems: string[];
	ask: string;
	askHead: [ string, string ];
	askRows: string[][];
	next: string;
} ) {
	return ( ids: Record< string, number > ): BlockSpec[] => [
		p( text.intro ),
		[ 'tinta/callout', { emoji: '💡' }, [ p( text.buddy ) ] ],
		h( text.week ),
		list( text.weekItems ),
		h( text.ask ),
		[
			'core/table',
			{
				head: [
					{
						cells: text.askHead.map( ( content ) => ( {
							content,
							tag: 'th',
						} ) ),
					},
				],
				body: text.askRows.map( ( row ) => ( {
					cells: row.map( ( content ) => ( { content, tag: 'td' } ) ),
				} ) ),
			},
		],
		h( text.next ),
		[ 'tinta/page-link', { pageId: ids.tools } ],
		[ 'tinta/page-link', { pageId: ids.how } ],
	];
}

/**
 * The deploys page the color scheme screenshot shows.
 *
 * @param text         Its text.
 * @param text.intro
 * @param text.warning
 * @param text.before
 * @param text.checks
 * @param text.deploy
 * @param text.after
 */
function deploysPage( text: {
	intro: string;
	warning: string;
	before: string;
	checks: string[];
	deploy: string;
	after: string;
} ): BlockSpec[] {
	return [
		p( text.intro ),
		[ 'tinta/callout', { emoji: '⚠️' }, [ p( text.warning ) ] ],
		h( text.before ),
		list( text.checks ),
		h( text.deploy ),
		[
			'core/code',
			{ content: 'git tag v2.14.0 && git push origin v2.14.0' },
		],
		p( text.after ),
	];
}

const COPY: Record< Locale, Copy > = {
	en: {
		workspace: 'Blue Fern Studio',
		pages: [
			{
				key: 'handbook',
				title: 'Handbook',
				icon: '📘',
				blocks: [
					p( 'How we work at Blue Fern, from your first day on.' ),
				],
			},
			{
				key: 'onboarding',
				title: 'Onboarding',
				icon: '👋',
				parent: 'handbook',
			},
			{
				key: 'how',
				title: 'How we work',
				icon: '🧭',
				parent: 'handbook',
			},
			{
				key: 'timeoff',
				title: 'Time off',
				icon: '🏖️',
				parent: 'handbook',
			},
			{
				key: 'tools',
				title: 'Tools and accounts',
				icon: '🔑',
				parent: 'handbook',
			},
			{ key: 'engineering', title: 'Engineering', icon: '🛠️' },
			{
				key: 'deploys',
				title: 'Deploys',
				icon: '🚀',
				parent: 'engineering',
			},
			{
				key: 'oncall',
				title: 'On-call',
				icon: '📟',
				parent: 'engineering',
			},
			{ key: 'design', title: 'Design', icon: '🎨' },
			{
				key: 'brand',
				title: 'Brand guidelines',
				icon: '🖌️',
				parent: 'design',
			},
			{ key: 'clients', title: 'Clients', icon: '🤝' },
			{ key: 'meetings', title: 'Meetings', icon: '🗓️' },
			{
				key: 'weekly',
				title: 'Weekly sync',
				icon: '📝',
				parent: 'meetings',
			},
			{ key: 'retro', title: 'Q4 retro', icon: '🔁', parent: 'meetings' },
		],
		deploys: deploysPage( {
			intro: 'We deploy the website and client sites from the main branch, twice a week.',
			warning:
				'No deploys on Friday afternoons. If something breaks, it waits until Monday.',
			before: 'Before you deploy',
			checks: [
				'Checks pass on the pull request.',
				'Someone else reviewed the change.',
				'The staging site looks right on a phone.',
			],
			deploy: 'Deploy',
			after: 'The release workflow builds the site and posts in #deploys when it is live.',
		} ),
		onboarding: onboardingPage( {
			intro: 'Welcome to Blue Fern! This page walks you through your first week. Nothing here is urgent: read, meet people, ask a lot.',
			buddy: 'Your buddy for the first month is Ana. Book thirty minutes with her on day one.',
			week: 'Your first week',
			weekItems: [
				'Set up your laptop and accounts.',
				'Read How we work and the brand guidelines.',
				'Join the weekly sync on Monday at 10:00.',
				'Ship a small change to the website by Friday.',
			],
			ask: 'Who to ask',
			askHead: [ 'Topic', 'Person' ],
			askRows: [
				[ 'Laptops and accounts', 'Rafael' ],
				[ 'Payroll and time off', 'Ana' ],
				[ 'Design reviews', 'Maya' ],
			],
			next: 'Read next',
		} ),
		notes: [
			'Should we mention the laptop pickup on Monday morning?',
			( mention ) =>
				`Good call. ${ mention } can you add the pickup times?`,
			'Added them to Tools and accounts, with the office address.',
		],
		search: 'de',
		ui: {
			untitled: 'Untitled',
			notesOnBlock: /notes on this block/,
			notes: 'Notes',
			setup: 'Set up your workspace',
			skip: 'Skip for now',
			openSidebar: 'Open sidebar',
		},
	},
	pt_BR: {
		workspace: 'Estúdio Samambaia',
		pages: [
			{
				key: 'handbook',
				title: 'Manual',
				icon: '📘',
				blocks: [
					p(
						'Como trabalhamos na Samambaia, desde o seu primeiro dia.'
					),
				],
			},
			{
				key: 'onboarding',
				title: 'Integração',
				icon: '👋',
				parent: 'handbook',
			},
			{
				key: 'how',
				title: 'Como trabalhamos',
				icon: '🧭',
				parent: 'handbook',
			},
			{
				key: 'timeoff',
				title: 'Férias e folgas',
				icon: '🏖️',
				parent: 'handbook',
			},
			{
				key: 'tools',
				title: 'Ferramentas e contas',
				icon: '🔑',
				parent: 'handbook',
			},
			{ key: 'engineering', title: 'Engenharia', icon: '🛠️' },
			{
				key: 'deploys',
				title: 'Deploys',
				icon: '🚀',
				parent: 'engineering',
			},
			{
				key: 'oncall',
				title: 'Plantão',
				icon: '📟',
				parent: 'engineering',
			},
			{ key: 'design', title: 'Design', icon: '🎨' },
			{
				key: 'brand',
				title: 'Guia da marca',
				icon: '🖌️',
				parent: 'design',
			},
			{ key: 'clients', title: 'Clientes', icon: '🤝' },
			{ key: 'meetings', title: 'Reuniões', icon: '🗓️' },
			{
				key: 'weekly',
				title: 'Reunião semanal',
				icon: '📝',
				parent: 'meetings',
			},
			{
				key: 'retro',
				title: 'Retro do 4º trimestre',
				icon: '🔁',
				parent: 'meetings',
			},
		],
		deploys: deploysPage( {
			intro: 'Publicamos o site e os sites de clientes a partir da branch principal, duas vezes por semana.',
			warning:
				'Nada de deploy na sexta à tarde. Se algo quebrar, fica para segunda.',
			before: 'Antes do deploy',
			checks: [
				'Os testes passam no pull request.',
				'Outra pessoa revisou a mudança.',
				'O site de homologação fica certo no celular.',
			],
			deploy: 'Deploy',
			after: 'O workflow de release gera o site e avisa em #deploys quando ele estiver no ar.',
		} ),
		onboarding: onboardingPage( {
			intro: 'Boas-vindas à Samambaia! Esta página guia a sua primeira semana. Nada aqui é urgente: leia, conheça as pessoas e pergunte bastante.',
			buddy: 'A sua dupla no primeiro mês é a Ana. Marque trinta minutos com ela no primeiro dia.',
			week: 'Sua primeira semana',
			weekItems: [
				'Configure o seu notebook e as suas contas.',
				'Leia Como trabalhamos e o guia da marca.',
				'Participe da reunião semanal na segunda, às 10h.',
				'Publique uma pequena mudança no site até sexta.',
			],
			ask: 'A quem perguntar',
			askHead: [ 'Assunto', 'Pessoa' ],
			askRows: [
				[ 'Notebooks e contas', 'Rafael' ],
				[ 'Pagamentos e férias', 'Ana' ],
				[ 'Revisões de design', 'Maya' ],
			],
			next: 'Leia a seguir',
		} ),
		notes: [
			'Vale avisar sobre a retirada dos notebooks na segunda de manhã?',
			( mention ) =>
				`Boa ideia. ${ mention }, pode adicionar os horários de retirada?`,
			'Adicionei em Ferramentas e contas, com o endereço do escritório.',
		],
		search: 're',
		ui: {
			untitled: 'Sem título',
			notesOnBlock: /neste bloco/,
			notes: 'Notas',
			setup: 'Configure o seu espaço de trabalho',
			skip: 'Pular por enquanto',
			openSidebar: 'Abrir barra lateral',
		},
	},
};

test( 'takes the wordpress.org screenshots', async ( {
	admin,
	page,
	requestUtils,
} ) => {
	test.setTimeout( 180_000 );
	const locale = ( test.info().project.metadata?.locale ?? 'en' ) as Locale;
	const copy = COPY[ locale ];
	await resetSite( requestUtils, copy, locale );
	const people = await addPeople( requestUtils );
	await setSettings( requestUtils, { workspace_mode: true } );
	try {
		await takeScreenshots(
			admin,
			page,
			requestUtils,
			people,
			copy,
			locale === 'en' ? '' : `-${ locale }`
		);
	} finally {
		await setSettings( requestUtils, {
			workspace_mode: false,
			setup_done: true,
		} );
	}
} );

/**
 * Builds the workspace and takes the screenshots, with workspace mode on.
 *
 * @param admin        Admin helpers.
 * @param page         Playwright page.
 * @param requestUtils REST helpers, as Maya.
 * @param people       Ana and Rafael.
 * @param copy         Content and labels in the screenshots' locale.
 * @param suffix       File name suffix for the locale.
 */
async function takeScreenshots(
	admin: Admin,
	page: Page,
	requestUtils: RequestUtils,
	people: Awaited< ReturnType< typeof addPeople > >,
	copy: Copy,
	suffix: string
) {
	const shot = ( number: number ) =>
		page.screenshot( {
			path: `${ OUT }/screenshot-${ number }${ suffix }.png`,
		} );
	const open = ( pageId: number ) =>
		openPage( admin, page, pageId, copy.ui.untitled );

	await admin.visitAdminPage( 'admin.php', 'page=tinta' );
	const ids = await createPages( page, copy.pages );
	const noteId = await addNotes(
		requestUtils,
		people,
		ids.onboarding,
		copy.notes
	);
	await setContent( page, ids.onboarding, copy.onboarding( ids ), noteId );
	await setContent( page, ids.deploys, copy.deploys );
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: {
			tinta_prefs: {
				pinned: [ ids.onboarding, ids.deploys ],
				recent: [ ids.weekly, ids.deploys, ids.brand ],
				expanded: [ ids.handbook, ids.meetings ],
				emojis: [],
			},
		},
	} );

	await open( ids.onboarding );
	await shot( 1 );

	await page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.getByRole( 'button', { name: copy.ui.notesOnBlock } )
		.click();
	await expect(
		page.getByRole( 'complementary', { name: copy.ui.notes } )
	).toBeVisible();
	await parkMouse( page );
	await shot( 2 );

	await open( ids.onboarding );
	await page.keyboard.press( 'ControlOrMeta+k' );
	await page.keyboard.type( copy.search );
	await expect( page.getByRole( 'option' ).first() ).toBeVisible();
	await shot( 3 );

	await setSettings( requestUtils, { setup_done: false } );
	await open( ids.onboarding );
	await expect(
		page.getByRole( 'dialog', { name: copy.ui.setup } )
	).toBeVisible();
	await shot( 4 );
	await page.getByRole( 'button', { name: copy.ui.skip } ).click();

	const scheme = await setColorScheme( requestUtils, 'midnight' );
	await open( ids.deploys );
	await shot( 5 );
	await setColorScheme( requestUtils, scheme );

	await page.setViewportSize( { width: 390, height: 844 } );
	await open( ids.onboarding );
	await page.getByRole( 'button', { name: copy.ui.openSidebar } ).click();
	const deploys = copy.pages.find( ( spec ) => spec.key === 'deploys' );
	await expect(
		page.getByRole( 'link', { name: deploys?.title } ).first()
	).toBeVisible();
	await shot( 6 );
}

/**
 * Starts from an empty workspace with the studio's name and icon, and Maya's
 * profile in the screenshots' locale.
 *
 * @param requestUtils REST helpers.
 * @param copy         Content in the screenshots' locale.
 * @param locale       The locale.
 */
async function resetSite(
	requestUtils: RequestUtils,
	copy: Copy,
	locale: Locale
) {
	const docs = await requestUtils.rest< { id: number }[] >( {
		path: '/wp/v2/tinta-docs',
		params: { status: 'private,trash', per_page: 100, context: 'edit' },
	} );
	await Promise.all(
		docs.map( ( { id } ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/tinta-docs/${ id }`,
				params: { force: true },
			} )
		)
	);
	await requestUtils.deleteAllUsers();
	const icon = await requestUtils.uploadMedia(
		'tests/screenshots/site-icon.png'
	);
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: {
			title: copy.workspace,
			site_icon: icon.id,
			tinta_settings: { setup_done: true },
		},
	} );
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: {
			first_name: 'Maya',
			last_name: 'Chen',
			name: 'Maya Chen',
			locale: locale === 'en' ? 'en_US' : locale,
		},
	} );
}

/**
 * Adds two Members, signed in for their own notes before the site turns private.
 *
 * @param requestUtils REST helpers.
 */
async function addPeople( requestUtils: RequestUtils ) {
	const add = async ( username: string, first: string, last: string ) => {
		const user = await requestUtils.createUser( {
			username,
			email: `${ username }@example.com`,
			firstName: first,
			lastName: last,
			password: PASSWORD,
			roles: [ 'tinta_member' ],
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/users/${ user.id }`,
			data: { name: `${ first } ${ last }` },
		} );
		const utils = await RequestUtils.setup( {
			user: { username, password: PASSWORD },
		} );
		await utils.setupRest();

		return { id: user.id, name: `${ first } ${ last }`, utils };
	};

	return {
		ana: await add( 'ana', 'Ana', 'Souza' ),
		rafael: await add( 'rafael', 'Rafael', 'Lima' ),
	};
}

/**
 * Creates the pages in order, through the REST API, from the workspace screen.
 *
 * @param page  Playwright page.
 * @param specs Pages, parents first.
 * @return Page IDs by key.
 */
function createPages( page: Page, specs: PageSpec[] ) {
	const rows = specs.map( ( { key, title, icon, parent = '' } ) => ( {
		key,
		title,
		icon,
		parent,
	} ) );

	return page.evaluate( async ( pages ) => {
		const ids: Record< string, number > = {};
		const order: Record< number, number > = {};

		for ( const spec of pages ) {
			const parent = spec.parent ? ids[ spec.parent ] : 0;
			order[ parent ] = ( order[ parent ] ?? -1 ) + 1;
			const created = await (
				window as unknown as { wp: WpGlobals }
			 ).wp.apiFetch< { id: number } >( {
				path: '/wp/v2/tinta-docs',
				method: 'POST',
				data: {
					title: spec.title,
					parent,
					menu_order: order[ parent ],
					status: 'private',
					meta: { _tinta_icon: spec.icon },
				},
			} );
			ids[ spec.key ] = created.id;
		}

		return ids;
	}, rows );
}

/**
 * Saves a page's content, built from blocks so the markup matches the editor's.
 *
 * @param page   Playwright page.
 * @param pageId Page ID.
 * @param blocks Content.
 * @param noteId Note on the first block, if any.
 */
function setContent(
	page: Page,
	pageId: number,
	blocks: BlockSpec[],
	noteId = 0
) {
	return page.evaluate(
		async ( { id, json, note } ) => {
			const { createBlock, serialize } = (
				window as unknown as { wp: WpGlobals }
			 ).wp.blocks;
			const build = ( [
				name,
				attributes = {},
				inner = [],
			]: BlockSpec ): Block =>
				createBlock( name, attributes, inner.map( build ) );
			const built = ( JSON.parse( json ) as BlockSpec[] ).map( build );
			if ( note ) {
				built[ 0 ].attributes.metadata = { noteId: [ note ] };
			}

			await ( window as unknown as { wp: WpGlobals } ).wp.apiFetch( {
				path: `/wp/v2/tinta-docs/${ id }`,
				method: 'POST',
				data: { content: serialize( built ) },
			} );
		},
		{ id: pageId, json: JSON.stringify( blocks ), note: noteId }
	);
}

/**
 * A short thread on the Onboarding page: Ana asks, Maya mentions Rafael, Rafael answers.
 *
 * @param requestUtils REST helpers, as Maya.
 * @param people       Ana and Rafael.
 * @param pageId       Onboarding's ID.
 * @param text         The three notes; the second mentions Rafael.
 * @return The thread's first note.
 */
async function addNotes(
	requestUtils: RequestUtils,
	people: Awaited< ReturnType< typeof addPeople > >,
	pageId: number,
	text: Copy[ 'notes' ]
) {
	const note = ( utils: RequestUtils, content: string, parent = 0 ) =>
		utils.rest< { id: number } >( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: pageId,
				content,
				parent,
				type: 'note',
				status: 'hold',
			},
		} );
	const { rafael } = people;
	const pause = () =>
		new Promise( ( resolve ) => setTimeout( resolve, 1100 ) );
	const root = await note( people.ana.utils, text[ 0 ] );
	await pause();
	await note(
		requestUtils,
		text[ 1 ](
			`<span class="wp-note-mention user-${ rafael.id }">@${ rafael.name }</span>`
		),
		root.id
	);
	await pause();
	await note( rafael.utils, text[ 2 ], root.id );

	return root.id;
}

/**
 * Opens a page in the workspace and waits for its title.
 *
 * @param admin    Admin helpers.
 * @param page     Playwright page.
 * @param pageId   Page ID.
 * @param untitled The title field's label in the screenshots' locale.
 */
async function openPage(
	admin: Admin,
	page: Page,
	pageId: number,
	untitled: string
) {
	await admin.visitAdminPage( 'admin.php', `page=tinta&doc=${ pageId }` );
	await expect(
		page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'textbox', { name: untitled } )
	).toBeVisible();
	await parkMouse( page );
}

/**
 * Moves the pointer above the content, where it shows no hover controls.
 *
 * @param page Playwright page.
 */
async function parkMouse( page: Page ) {
	await page.mouse.move( page.viewportSize()!.width / 2, 60 );
}

/**
 * Picks Maya's admin color scheme (core's `admin_color`, as Settings → Profile
 * saves it).
 *
 * @param requestUtils REST helpers, as Maya.
 * @param scheme       Scheme slug.
 * @return The scheme it replaced.
 */
async function setColorScheme( requestUtils: RequestUtils, scheme: string ) {
	const { meta } = await requestUtils.rest< {
		meta: { admin_color?: string };
	} >( {
		path: '/wp/v2/users/me',
		params: { context: 'edit' },
	} );
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: { meta: { admin_color: scheme } },
	} );

	return meta.admin_color || 'fresh';
}

/**
 * Changes Tinta's settings.
 *
 * @param requestUtils            REST helpers.
 * @param settings                Settings to change.
 * @param settings.workspace_mode
 * @param settings.setup_done
 */
function setSettings(
	requestUtils: RequestUtils,
	settings: { workspace_mode?: boolean; setup_done?: boolean }
) {
	return requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: { tinta_settings: settings },
	} );
}
