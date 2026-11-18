/**
 * Settings: core's Modal with core's TabPanel. A side column holds the title
 * and the tabs (on top on small screens); each tab has a heading, its
 * settings in cards, and its actions. Administrators get the workspace's
 * tabs; everyone gets the tabs about themselves.
 */
import { Modal, TabPanel } from '@wordpress/components';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

import { config } from '../config';
import { GeneralTab } from './general-tab';
import { PeopleTab } from './people-tab';
import { ProfileTab } from './profile-tab';

export type SettingsTabName = 'general' | 'people' | 'profile';

interface SettingsDialogProps {
	initialTab?: SettingsTabName;
	onClose: () => void;
}

/**
 * The tabs this person can open.
 */
function tabs(): { name: SettingsTabName; title: string }[] {
	const profile = {
		name: 'profile' as const,
		title: __( 'Profile', 'tinta' ),
	};

	return config.canManage
		? [
				{ name: 'general', title: __( 'General', 'tinta' ) },
				{ name: 'people', title: __( 'People', 'tinta' ) },
				profile,
			]
		: [ profile ];
}

/**
 * Renders the dialog.
 *
 * @param props            Props.
 * @param props.initialTab Tab to open first.
 * @param props.onClose    Closes the dialog.
 */
export function SettingsDialog( { initialTab, onClose }: SettingsDialogProps ) {
	const isSmall = useViewportMatch( 'medium', '<' );
	const titleId = useInstanceId( SettingsDialog, 'tinta-settings-title' );

	return (
		<Modal
			aria={ { labelledby: titleId } }
			className="tinta-settings-dialog"
			size="large"
			onRequestClose={ onClose }
		>
			<div
				className={
					isSmall
						? 'tinta-settings-layout'
						: 'tinta-settings-layout is-side'
				}
			>
				<h1 id={ titleId } className="tinta-settings-layout__title">
					{ __( 'Settings', 'tinta' ) }
				</h1>
				<TabPanel
					className="tinta-settings-tabs"
					orientation={ isSmall ? 'horizontal' : 'vertical' }
					tabs={ tabs() }
					initialTabName={ initialTab }
				>
					{ ( tab ) => (
						<>
							<h2 className="tinta-settings-layout__heading">
								{ tab.title }
							</h2>
							<SettingsTab
								name={ tab.name as SettingsTabName }
								onClose={ onClose }
							/>
						</>
					) }
				</TabPanel>
			</div>
		</Modal>
	);
}

/**
 * Renders a tab's content.
 *
 * @param props         Props.
 * @param props.name    Tab.
 * @param props.onClose Closes the dialog.
 */
function SettingsTab( {
	name,
	onClose,
}: {
	name: SettingsTabName;
	onClose: () => void;
} ) {
	switch ( name ) {
		case 'general':
			return <GeneralTab onClose={ onClose } />;
		case 'people':
			return <PeopleTab />;
		case 'profile':
			return <ProfileTab onClose={ onClose } />;
	}

	return null;
}
