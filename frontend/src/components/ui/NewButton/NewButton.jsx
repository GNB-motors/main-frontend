import { forwardRef } from "react";
import styles from "./NewButton.module.css";

/**
 * Shared action button — use it for Apply / Cancel / Save / Delete and friends.
 *
 * @typedef {"primary" | "secondary" | "tertiary" | "danger" | "ghost" | "link"} NewButtonVariant
 * @typedef {"xs" | "sm" | "md" | "lg" | "xl"} NewButtonSize
 *
 * @typedef {Object} NewButtonProps
 * @property {NewButtonVariant} [variant="primary"]
 * @property {string} [text] Label. `children` wins when both are given.
 * @property {React.ReactNode} [children]
 * @property {(event: React.MouseEvent<HTMLButtonElement>) => void} [onClick]
 * @property {NewButtonSize} [size="lg"]
 * @property {"button" | "submit" | "reset"} [type="button"] Keep "button" for Cancel inside a <form>.
 * @property {string | number} [width]
 * @property {boolean} [fullWidth]
 * @property {boolean} [fullRounded]
 * @property {boolean} [disabled]
 * @property {boolean} [loading] Shows a spinner and blocks clicks.
 * @property {boolean} [selected] Toggle/segmented "on" state — also sets aria-pressed.
 * @property {boolean} [iconOnly] Square button with no label. Pass the icon as children and set aria-label.
 * @property {React.ReactNode} [prependIcon]
 * @property {React.ReactNode} [appendIcon]
 * @property {number} [prependGap=8]
 * @property {number} [appendGap=8]
 * @property {string} [className] Merged onto the root (layout / radius overrides from a parent stylesheet).
 */

const VARIANT_CLASS_MAP = {
    primary: "primary",
    secondary: "secondary",
    tertiary: "tertiary",
    danger: "danger",
    ghost: "ghost",
    link: "link",
};

const SIZE_CLASS_MAP = {
    xs: "sizeXs",
    sm: "sizeSm",
    md: "sizeMd",
    lg: "sizeLg",
    xl: "sizeXl",
};

const DEFAULT_ICON_GAP = 8;

/** @type {React.ForwardRefExoticComponent<NewButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>} */
const NewButton = forwardRef(function NewButton(
    {
        variant = "primary",
        text,
        children,
        onClick,
        size = "lg",
        type = "button",
        width,
        fullWidth = false,
        fullRounded = false,
        disabled = false,
        loading = false,
        selected = false,
        iconOnly = false,
        prependIcon,
        appendIcon,
        prependGap = DEFAULT_ICON_GAP,
        appendGap = DEFAULT_ICON_GAP,
        className: classNameProp,
        style: styleProp,
        ...rest
    },
    ref
) {
    const isDisabled = disabled || loading;

    const style = { ...styleProp };
    if (width !== undefined) {
        style.width = typeof width === "number" ? `${width}px` : width;
    }

    const className = [
        styles.button,
        styles[SIZE_CLASS_MAP[size] ?? SIZE_CLASS_MAP.lg],
        styles[VARIANT_CLASS_MAP[variant] ?? VARIANT_CLASS_MAP.primary],
        fullWidth && styles.fullWidth,
        fullRounded && styles.fullRounded,
        iconOnly && styles.iconOnly,
        selected && styles.selected,
        loading && styles.loading,
        isDisabled && styles.disabled,
        classNameProp,
    ]
        .filter(Boolean)
        .join(" ");

    const handleClick = (event) => {
        if (isDisabled) return;
        onClick?.(event);
    };

    // While loading the spinner takes the leading slot so the button doesn't resize.
    const leadingIcon = loading ? <span className={styles.spinner} /> : prependIcon;
    const label = children ?? text;

    const commonProps = {
        ...rest,
        type,
        className,
        style,
        onClick: handleClick,
        disabled: isDisabled,
        "aria-busy": loading || undefined,
        "aria-pressed": selected || undefined,
    };

    // Icon-only renders its children bare so absolutely-positioned extras (count
    // badges, dots) still anchor to the button itself.
    if (iconOnly) {
        return (
            <button {...commonProps} ref={ref}>
                {loading ? <span className={styles.spinner} /> : children}
            </button>
        );
    }

    return (
        <button {...commonProps} ref={ref}>
            {leadingIcon && (
                <span
                    className={styles.prependIcon}
                    style={{ marginRight: label ? prependGap : 0 }}
                >
                    {leadingIcon}
                </span>
            )}
            {label && <span className={styles.buttonText}>{label}</span>}
            {appendIcon && !loading && (
                <span className={styles.appendIcon} style={{ marginLeft: label ? appendGap : 0 }}>
                    {appendIcon}
                </span>
            )}
        </button>
    );
});

export default NewButton;
