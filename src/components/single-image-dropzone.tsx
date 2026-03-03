"use client";

import { UploadCloudIcon, X } from "lucide-react";
import * as React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { twMerge } from "tailwind-merge";

const variants = {
    base: "relative rounded-md flex justify-center items-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 transition-colors duration-200 ease-in-out",
    image:
        "border-0 p-0 w-full h-full relative shadow-md bg-slate-200 dark:bg-slate-900 rounded-md",
    active: "border-gray-400 bg-slate-100 dark:bg-slate-800",
    disabled:
        "bg-gray-200 border-gray-300 cursor-default pointer-events-none opacity-50 dark:bg-gray-700",
    accept: "border-blue-500 bg-blue-50 dark:bg-slate-800",
    reject: "border-red-500 bg-red-50 dark:bg-slate-800",
};

type InputProps = {
    width?: number;
    height?: number;
    className?: string;
    value?: File | string;
    onChange?: (file?: File) => void | Promise<void>;
    disabled?: boolean;
    dropzoneOptions?: Omit<DropzoneOptions, "disabled">;
};

const ERROR_MESSAGES = {
    fileTooLarge(maxSize: number) {
        return `The file is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    },
    fileInvalidType() {
        return "Invalid file type.";
    },
    tooManyFiles(maxFiles: number) {
        return `You can only add ${maxFiles} file(s).`;
    },
    fileNotSupported() {
        return "The file is not supported.";
    },
};

const SingleImageDropzone = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { dropzoneOptions, width, height, value, className, disabled, onChange },
        ref
    ) => {
        const imageUrl = React.useMemo(() => {
            if (typeof value === "string") {
                return value;
            } else if (value) {
                return URL.createObjectURL(value);
            }
            return null;
        }, [value]);

        // dropzone configuration
        const {
            getRootProps,
            getInputProps,
            isDragAccept,
            isDragReject,
            isDragActive,
        } = useDropzone({
            accept: { "image/*": [] },
            multiple: false,
            disabled,
            onDrop: (acceptedFiles) => {
                const file = acceptedFiles[0];
                if (file) {
                    void onChange?.(file);
                }
            },
            ...dropzoneOptions,
        });

        // styling
        const dropZoneClassName = React.useMemo(
            () =>
                twMerge(
                    variants.base,
                    isDragActive && variants.active,
                    isDragAccept && variants.accept,
                    isDragReject && variants.reject,
                    disabled && variants.disabled,
                    imageUrl && variants.image,
                    className
                ).trim(),
            [
                isDragActive,
                isDragAccept,
                isDragReject,
                disabled,
                imageUrl,
                className,
            ]
        );

        return (
            <div className="relative w-full">
                <div
                    {...getRootProps({
                        className: dropZoneClassName,
                        style: {
                            width,
                            height,
                        },
                    })}
                >
                    {/* Main Input */}
                    <input ref={ref} {...getInputProps()} />

                    {imageUrl ? (
                        // Image Preview
                        <img
                            className="h-full w-full rounded-md object-cover"
                            src={imageUrl}
                            alt="Preview"
                        />
                    ) : (
                        // Upload Icon
                        <div className="flex flex-col items-center justify-center text-xs text-gray-400">
                            <UploadCloudIcon className="mb-2 h-7 w-7" />
                            <div className="text-gray-400">
                                Click or drag file to this area to upload
                            </div>
                        </div>
                    )}

                    {/* Remove Image Icon */}
                    {imageUrl && !disabled && (
                        <div
                            className="group absolute right-2 top-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                void onChange?.(undefined);
                            }}
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-solid border-gray-500 bg-white transition-all duration-300 hover:h-6 hover:w-6 dark:bg-black">
                                <X className="text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);
SingleImageDropzone.displayName = "SingleImageDropzone";

export { SingleImageDropzone };
