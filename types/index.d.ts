import { PopulateOptions } from 'mongoose'


declare global {
    type Options = {
        index: string,
        populate: PopulateOptions[],
    }
}

export {}