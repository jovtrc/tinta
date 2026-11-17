/**
 * Settings: core's Modal with core's TabPanel, tabs on the side (on top on
 * small screens). Administrators get the workspace's tabs; everyone gets the
 * tabs about themselves.
 */
import { Modal, TabPanel } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

import { config } from '../config';
import { GeneralTab } from './general-tab';

export type SettingsTabName = 'general';

interface SettingsDialogProps {
	initialTab?: SettingsTabName;
	onClose: () => void;
}

/**
 * The tabs this person can open.
 */
function tabs(): { name: SettingsTabName; title: string }[] {
	return config.canManage
		? [ { name: 'general', title: __( 'General', 'tinta' ) } ]
		: [];
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

	return (
		<Modal
			title={ __( 'Settings', 'tinta' ) }
			className="tinta-settings-dialog"
			size="large"
			onRequestClose={ onClose }
		>
			<TabPanel
				className={
					isSmall
						? 'tinta-settings-tabs'
						: 'tinta-settings-tabs is-side'
				}
				orientation={ isSmall ? 'horizontal' : 'vertical' }
				tabs={ tabs() }
				initialTabName={ initialTab }
			>
				{ ( tab ) => (
					<SettingsTab
						name={ tab.name as SettingsTabName }
						onClose={ onClose }
					/>
				) }
			</TabPanel>
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
	}

	return null;
}
