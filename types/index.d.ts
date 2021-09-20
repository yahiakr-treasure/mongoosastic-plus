/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientOptions, ApiResponse } from '@elastic/elasticsearch'
import { Aggregation, Highlight, Suggest, BulkResponse, CountResponse, RefreshResponse, SearchResponse } from '@elastic/elasticsearch/api/types'
import { EventEmitter } from 'events'
import { Schema } from 'mongoose'
import { Document, Model, PopulateOptions, QueryOptions } from 'mongoose'

declare interface FilterFn {
    (doc: Document): boolean;
}
declare interface TransformFn {
    (doc: Document): boolean;
}
declare interface CreateMappingCallbackFn {
    (err: any | null | undefined, inputMapping: any | null | undefined): void;
}
declare interface TruncateCallbackFn {
    (err: any | null | undefined): void;
}
declare interface SearchCallbackFn<T> {
    (err: null | undefined, resp: ApiResponse<SearchResponse<T>>): void;
    (err: any, resp: null | undefined): void;
}
declare interface CountCallbackFn {
    (err: null | undefined, resp: ApiResponse<CountResponse>): void;
    (err: any, resp: null | undefined): void;
}
declare interface FlushCallbackFn {
    (err: null | undefined, resp: ApiResponse<BulkResponse>): void;
    (err: any, resp: null | undefined): void;
}
declare interface RefreshCallbackFn {
    (err: null | undefined, resp: ApiResponse<RefreshResponse>): void;
    (err: any, resp: null | undefined): void;
}

declare class PluginDocument extends Document {
	index(cb?: CallableFunction): void
	unIndex(cb?: CallableFunction): void
	emit(event: string, ...args: any): void
	esOptions(): Options
	on(event: string, cb?: CallableFunction): void
	once(event: string, cb?: CallableFunction): void
}

declare type Options = {
    clientOptions?: ClientOptions,
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
    transform?(doc: any, ...args: any): any,
    indexAutomatically?: boolean,
    properties?: any,
    customSerialize?(model: PluginDocument | Model<PluginDocument>, mapping: any): any;
    saveOnSynchronize?: boolean
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

declare module 'mongoosastic' {
    const Mongoosastic: (schema: Schema, Options?: Partial<Options>) => void
    export = Mongoosastic;
}
  
declare module 'mongoose' {
    export function model<T extends PluginDocument>(name: string, schema?: Schema<T>, collection?: string, skipInit?: boolean): MongoosasticModel<T>;
    export interface MongoosasticModel<T extends Document> extends Model<T> {
        search(query: any, options: EsSearchOptions, cb?: SearchCallbackFn<T>): void;
        esSearch(query: any, options: EsSearchOptions, cb?: SearchCallbackFn<T>): void;
        synchronize(query?: any, options?: any): EventEmitter;
        esOptions(): Options
        createMapping(body: any, cb: SearchCallbackFn<T>): void
    }
}

export {
	Options,
	PluginDocument,
	EsSearchOptions
}