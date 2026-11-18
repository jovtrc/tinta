/**
 * A group of settings in core's Card: a title, a short description, the
 * controls, and an optional control beside the title (a toggle) or actions
 * in the card's footer.
 */
import { Card, CardBody, CardFooter } from '@wordpress/components';
import type { ReactNode } from 'react';

interface SettingsCardProps {
	title: string;
	titleId?: string;
	description?: ReactNode;
	descriptionId?: string;
	aside?: ReactNode;
	footer?: ReactNode;
	children?: ReactNode;
}

/**
 * Renders the card.
 *
 * @param props               Props.
 * @param props.title         Title.
 * @param props.titleId       ID for the title, to label a control with it.
 * @param props.description   Short description.
 * @param props.descriptionId ID for the description.
 * @param props.aside         Control beside the title.
 * @param props.footer        Actions under the card's content.
 * @param props.children      Controls.
 */
export function SettingsCard( {
	title,
	titleId,
	description,
	descriptionId,
	aside,
	footer,
	children,
}: SettingsCardProps ) {
	return (
		<Card className="tinta-settings-card">
			<CardBody className="tinta-settings-card__body">
				<div className="tinta-settings-card__header">
					<div className="tinta-settings-card__text">
						<h3
							id={ titleId }
							className="tinta-settings-card__title"
						>
							{ title }
						</h3>
						{ description && (
							<p
								id={ descriptionId }
								className="tinta-settings-card__description"
							>
								{ description }
							</p>
						) }
					</div>
					{ aside }
				</div>
				{ children }
			</CardBody>
			{ footer && (
				<CardFooter className="tinta-settings-card__footer">
					{ footer }
				</CardFooter>
			) }
		</Card>
	);
}
