import { Aggregate, Aggregation, Highlight, Suggest } from '@elastic/elasticsearch/api/types'
import { Document, PopulateOptions, QueryOptions } from 'mongoose'

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
    routing?(doc: Document): any,
    alwaysHydrate?: boolean,
    hydrateOptions?: QueryOptions,
    transform?(doc: Document): Document,
    indexAutomatically?: boolean,
}

declare type EsSearchOptions = {
    highlight?: Highlight,
    suggest?: Suggest,
    aggs?: Aggregation,
    min_score?: any,
    routing?: string,
    sort?: string | string[],
    hydrate?: boolean,
    hydrateOptions?: QueryOptions,
    hydrateWithESResults?: any
}

export {
	Options,
	PluginDocument,
	EsSearchOptions
}