/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientOptions, ApiResponse, Client } from '@elastic/elasticsearch'
import { Highlight, BulkResponse, CountResponse, RefreshResponse, SearchResponse, QueryContainer, SearchRequest, TypeMapping, Hit } from '@elastic/elasticsearch/api/types'
import { RequestBody } from '@elastic/elasticsearch/lib/Transport'
import { EventEmitter } from 'events'
import { Schema } from 'mongoose'
import { Document, Model, PopulateOptions, QueryOptions } from 'mongoose'

declare interface FilterFn {
    (doc: Document): boolean;
}
declare interface TransformFn {
    (doc: Document, ...args: any): any;
}
declare interface RoutingFn {
    (doc: Document): any;
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

declare interface GeneratedMapping extends TypeMapping {
    cast?(doc: any): any
}

declare interface BulkOptions {
    delay: number,
    size: number,
    batch: number,
}

declare interface IndexMethodOptions {
    index?: string,
}

declare interface SynchronizeOptions {
    saveOnSynchronize?: boolean
}

declare interface BulkIndexOptions {
    index: string,
    id: string,
    body: any,
    bulk?: BulkOptions,
    refresh?: boolean,
    routing?: RoutingFn,
    client: Client
}

declare interface BulkUnIndexOptions {
    index: string,
    id: string,
    bulk?: BulkOptions,
    document?: PluginDocument,
    tries?: number,
    routing?: RoutingFn,
    client: Client
}

declare interface DeleteByIdOptions {
    index: string,
    id: string,
    document: PluginDocument,
    tries: number,
    client: Client
}

declare class PluginDocument extends Document {
	index(cb?: CallableFunction): void
	unIndex(cb?: CallableFunction): void
	emit(event: string, ...args: any): void
	esOptions(): Options
	esClient(): Client
	on(event: string, cb?: CallableFunction): void
	once(event: string, cb?: CallableFunction): void
}

declare class HydratedDocument extends PluginDocument {
    _highlight?: Record<string, string[]> | undefined
    _esResult?: Hit<unknown>
}

declare type HydratedResults = any[]

declare type IndexInstruction = {
    index: {
        _index: string,
        _id: string,
    }
}

declare type DeleteInstruction = {
    delete: {
        _index: string,
        _id: string,
    }
}

declare type BulkInstruction = IndexInstruction | DeleteInstruction | Record<string, unknown>

declare type Options = {
    clientOptions?: ClientOptions,
    index?: string,
    populate?: PopulateOptions[],
    bulk?: BulkOptions,
    filter?: FilterFn,
    routing?: RoutingFn,
    alwaysHydrate?: boolean,
    hydrateOptions?: QueryOptions,
    transform?: TransformFn,
    indexAutomatically?: boolean,
    forceIndexRefresh?: boolean,
    properties?: any,
    customSerialize?(model: PluginDocument | Model<PluginDocument>, mapping: any): any;
    saveOnSynchronize?: boolean
}

declare type EsSearchOptions = {
    index?: string,
    highlight?: Highlight,
    suggest?: any,
    aggs?: any,
    min_score?: any,
    routing?: any,
    sort?: any,
    hydrate?: boolean,
    hydrateOptions?: QueryOptions,
    hydrateWithESResults?: any
}

declare module 'mongoosastic' {
    const Mongoosastic: (schema: Schema, Options?: Partial<Options>) => void
    export = Mongoosastic;
}

declare module 'mongoose' {

    export interface Model<T extends Document> {
        search(query: QueryContainer, cb?: SearchCallbackFn<T>): void;
        search(query: QueryContainer, options?: EsSearchOptions, cb?: SearchCallbackFn<T>): void;

        esSearch(query: SearchRequest['body'], cb?: SearchCallbackFn<T>): void;
        esSearch(query: SearchRequest['body'], options?: EsSearchOptions, cb?: SearchCallbackFn<T>): void;

        synchronize(query?: any, options?: any): EventEmitter;
        
        esOptions(): Options
        esClient(): Client

        createMapping(body?: RequestBody, cb?: CreateMappingCallbackFn): void
        esTruncate(cb?: TruncateCallbackFn): void

        esCount(cb?: CountCallbackFn): void
        esCount(query?: QueryContainer, cb?: CountCallbackFn): void

        refresh(cb?: RefreshCallbackFn): void
    }
}

export {
	Options,
	PluginDocument,
	EsSearchOptions,
	BulkIndexOptions,
	BulkUnIndexOptions,
	IndexMethodOptions,
	BulkOptions,
	SynchronizeOptions,
	DeleteByIdOptions,
	GeneratedMapping,
	HydratedDocument,
	HydratedResults,
	BulkInstruction
}