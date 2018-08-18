import { expect } from 'chai'
export function sortCommonCheck<T>(data: Array<T>, order: string, sortby: string) {
	let dataCompare = data.slice(0)
	switch (order){
		case "asc":	data.sort((a, b) => a[sortby] - b[sortby]); break;
		case "dsc":	data.sort((a, b) => b[sortby] - a[sortby]); break;
	}
	expect(data.toString()).to.eql(dataCompare.toString())
}

export function sortDateCheck<T>(data: Array<T>, order: string, sortby: string) {
	let dataCompare = data.slice(0)
	switch (order){
		case "asc":	data.sort((a, b) => {
			return new Date(a[sortby]).getTime() - new Date(b[sortby]).getTime()
		})
		break
		case "dsc":	data.sort((a, b) => {
			return new Date(b[sortby]).getTime() - new Date(a[sortby]).getTime()
		})
		break
	}
	expect(data.toString()).to.eql(dataCompare.toString())
}
