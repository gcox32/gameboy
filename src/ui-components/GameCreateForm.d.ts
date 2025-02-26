/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type GameCreateFormInputValues = {
    owner?: string;
    title?: string;
    releaseDate?: string;
    description?: string;
    img?: string;
    filePath?: string;
    backgroundImg?: string;
    series?: string;
    generation?: string;
};
export declare type GameCreateFormValidationValues = {
    owner?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    releaseDate?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    img?: ValidationFunction<string>;
    filePath?: ValidationFunction<string>;
    backgroundImg?: ValidationFunction<string>;
    series?: ValidationFunction<string>;
    generation?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type GameCreateFormOverridesProps = {
    GameCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    owner?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    releaseDate?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    img?: PrimitiveOverrideProps<TextFieldProps>;
    filePath?: PrimitiveOverrideProps<TextFieldProps>;
    backgroundImg?: PrimitiveOverrideProps<TextFieldProps>;
    series?: PrimitiveOverrideProps<TextFieldProps>;
    generation?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type GameCreateFormProps = React.PropsWithChildren<{
    overrides?: GameCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: GameCreateFormInputValues) => GameCreateFormInputValues;
    onSuccess?: (fields: GameCreateFormInputValues) => void;
    onError?: (fields: GameCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: GameCreateFormInputValues) => GameCreateFormInputValues;
    onValidate?: GameCreateFormValidationValues;
} & React.CSSProperties>;
export default function GameCreateForm(props: GameCreateFormProps): React.ReactElement<any>;
