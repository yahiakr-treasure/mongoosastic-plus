import { Document, PopulateOptions } from 'mongoose'

declare class PluginDocument extends Document {
	index(cb?: CallableFunction): void
	unIndex(cb?: CallableFunction): void
	emit(event: string, ...args: any): void
}

declare type Options = {
    index?: string,
    populate?: PopulateOptions[],
    bulk?: {
        delay: number,
        size: number,
        batch: number,
    },
    filter?(doc: Document): boolean,
}

export {
	Options,
	PluginDocument
}