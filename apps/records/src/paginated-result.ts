export class PaginatedResult<T> {    
    constructor(
        private readonly _items: T[],
        readonly page: number,
        readonly pageSize: number,
        readonly total: number
    ) {}

    get items() {
        return [ ...this._items ]
    }
}