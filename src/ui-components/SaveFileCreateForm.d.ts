/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type SaveFileCreateFormInputValues = {
    data?: string;
    title?: string;
    description?: string;
};
export declare type SaveFileCreateFormValidationValues = {
    data?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SaveFileCreateFormOverridesProps = {
    SaveFileCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    data?: PrimitiveOverrideProps<TextAreaFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SaveFileCreateFormProps = React.PropsWithChildren<{
    overrides?: SaveFileCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: SaveFileCreateFormInputValues) => SaveFileCreateFormInputValues;
    onSuccess?: (fields: SaveFileCreateFormInputValues) => void;
    onError?: (fields: SaveFileCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SaveFileCreateFormInputValues) => SaveFileCreateFormInputValues;
    onValidate?: SaveFileCreateFormValidationValues;
} & React.CSSProperties>;
export default function SaveFileCreateForm(props: SaveFileCreateFormProps): React.ReactElement;
