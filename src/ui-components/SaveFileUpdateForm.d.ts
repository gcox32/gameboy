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
export declare type SaveFileUpdateFormInputValues = {
    data?: string;
    title?: string;
    description?: string;
};
export declare type SaveFileUpdateFormValidationValues = {
    data?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SaveFileUpdateFormOverridesProps = {
    SaveFileUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    data?: PrimitiveOverrideProps<TextAreaFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type SaveFileUpdateFormProps = React.PropsWithChildren<{
    overrides?: SaveFileUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    saveFile?: any;
    onSubmit?: (fields: SaveFileUpdateFormInputValues) => SaveFileUpdateFormInputValues;
    onSuccess?: (fields: SaveFileUpdateFormInputValues) => void;
    onError?: (fields: SaveFileUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SaveFileUpdateFormInputValues) => SaveFileUpdateFormInputValues;
    onValidate?: SaveFileUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SaveFileUpdateForm(props: SaveFileUpdateFormProps): React.ReactElement;
