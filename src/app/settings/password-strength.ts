/**
 * Core's password strength meter (the `password-strength-meter` script, with
 * zxcvbn) and core's labels for it (`pwsL10n`).
 */

type StrengthLabel = 'unknown' | 'short' | 'bad' | 'good' | 'strong';

interface StrengthMeter {
	meter: (
		password: string,
		disallowed: string[],
		confirm: string
	) => number;
	userInputDisallowedList: () => string[];
}

interface CoreGlobals {
	wp?: { passwordStrength?: StrengthMeter };
	zxcvbn?: unknown;
	pwsL10n?: Record< StrengthLabel, string >;
}

const LABELS: StrengthLabel[] = [ 'short', 'short', 'bad', 'good', 'strong' ];

/**
 * How strong a password is, in core's words, or null while core's meter
 * isn't loaded.
 *
 * @param password Password.
 */
export function passwordStrength(
	password: string
): { label: string; isWeak: boolean } | null {
	const globals = window as unknown as CoreGlobals;
	const meter = globals.wp?.passwordStrength;
	if (
		! password ||
		! meter ||
		typeof globals.zxcvbn !== 'function' ||
		! globals.pwsL10n
	) {
		return null;
	}

	const score = meter.meter(
		password,
		meter.userInputDisallowedList(),
		password
	);

	return {
		label: globals.pwsL10n[ LABELS[ score ] ?? 'unknown' ],
		isWeak: score < 3,
	};
}
