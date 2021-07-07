import { PopulateOptions } from 'mongoose'


declare global {
    type Options = {
        index: string,
        populate: PopulateOptions[],
        bulk: {
            delay: number,
            size: number,
            batch: number,
        }
    }
}

export {}