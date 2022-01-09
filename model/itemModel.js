import * as firestore from "firebase-admin/firestore";

const fileDuration = 10000000000;
const debug = true;

function parsePrefix(dir)
{
	let items = dir.split("/");
	let filename = items[items.length - 1]
	return filename.split(".")[0]
}

async function getUrl(file)
{
	let res = await file.getSignedUrl({
		action: "read",
		expires: Date.now() + fileDuration
	})

	return res[0]
}

export default class userModel
{
	constructor(database, bucket)
	{
		this.itemsRef = database.collection("auctionItems");
		this.categoryRef = database.collection("categories");
		this.bucket = bucket;	
	}

	/**
	 * Do not call
	 * @param {QuerySnapshot} doc
	 * @returns {item} item data
	 */
	parseItemData(doc)
	{
		let data = doc.data();
		data.id = doc.id;
		data.postedTime = data.postedTime.toDate();
		return data;
	}

	/**
	 * 
	 * @param {string} id 
	 * @returns item data with this id
	 */
	async getItem(id)
	{
		let doc = await this.itemsRef.doc(id).get();
		return this.parseItemData(doc);
	}

	/**
	 * 
	 * @param {string} category 
	 * @param {number} start 
	 * @param {number} count 
	 * @param {("postedTime")} order 
	 * @returns {Promise<[item]>} array of items
	 */
	async getItemsByCategory(category, start = 0, count = 5, order = "postedTime")
	{
		let res = await this.itemsRef
								.where("category", "==", category)
								.orderBy(order)
								.startAfter(start)
								.limit(count)
								.get();

		return res.docs.map(doc => this.parseItemData(doc));
	}

	/**
	 * Get the main image of an item
	 * @param {string} id 
	 * @returns {Promise<url>} url of the main images
	 */
	async getMainImageUrl(id)
	{
		let res = await this.bucket.getFiles({prefix: `items/${id}`})
		for (let file of res[0])
			if (parsePrefix(file.name) == "main")
				return await getUrl(file);
	}
	
	/**
	 * Get non-main images of an item
	 * @param {string} id 
	 * @returns {Promise<[url]>} array of urls of images
	 */
	async getExtraImageUrls(id)
	{
		let res = await this.bucket.getFiles({prefix: `items/${id}`})
		let urls = [];
		for (let i = 1; i < res[0].length; i++) {
			let file = res[0][i];
			if (parsePrefix(file.name) != "main")
				urls.push(await getUrl(file));
		}
		return urls;
	}

	/**
	 * 
	 * @returns an object:
	 * ```javascript
	 * {
	 * 		catgories: [] // category names
	 * 		|category|: [] // subcategories
	 * }	
	 * ```
	 */
	async getAllCategories() {
		let snapshot = await this.categoryRef.get();
		let res = {
			categories: []
		}
		
		snapshot.forEach((doc) => {
			res.categories.push(doc.id);
			res[doc.id] = [];
			for (let subcat in doc.data()) 
				res[doc.id].push(subcat);
		})

		return res;
	}

	/**
	 * @param {string} category
	 * @returns {Promise<[string]} array of subcategory names
	 */
	 async getSubcategories(category) {
		let snapshot = await this.categoryRef.get(category);
		let res = []
		for (let subcat in snapshot.data()) 
			res.push(subcat);
		return res;
	}

	/**
	 * Add item image to storage
	 * @param {string} id item id
	 * @param data
	 * ```
	 * {
	 * 	mainImage: binary
	 * 	images: [binary]
	 * }
	 * ```
	 */
	async addImages(id, data)
	{
		let mainImageSave = null;
		if (data.mainImage)
			mainImageSave = this.bucket.file(`items/${id}/main.jpg`).save(data.mainImage);
		
		let imageSaves = [];
		if (data.images && data.images.length)
			for (let i = 0; i < data.images.length; i++)
				imageSaves.push(this.bucket.file(`items/${id}/${i}.jpg`).save(data.images[i]));

		if (mainImageSave)
			await mainImageSave;
		for (let promise of imageSaves)
			await promise;
		
		if (debug) 
			console.log(`Uploaded ${imageSaves.length + 1} images for item ${id}`);
	}

	/**
	 * Add item to database. Item must have: 
	 * ```javascript
	 * {
	 * 	name: string,
	 * 	maximumPrice: number, 
	 * 	category: string,
	 * 	step: number,
	 * 	description: string,
	 * 	postedTime: Date,
	 * 	autoExtend: boolean,
	 * 	seller: string,
	 * 	startingPrice: number
	 * 	mainImage: binary
	 * 	images: [binaries]
	 * }
	 * ```
	 * @param {itemData} item 
	 * @returns {Promise<String>} item id
	 */
	async addItem(item)
	{
		let itemData = {
			name: item.name,
			maximumPrice: item.maximumPrice,
			category: item.category,
			step: item.step,
			description: item.description,
			postedTime: item.postedTime,
			autoExtend: item.autoExtend,
			seller: item.seller,
			listing: true,
			startingPrice: item.startingPrice
		}

		let doc = await this.itemsRef.add(itemData);

		this.addImages(doc.id, item);

		if (debug)
			console.log(`Added item ${itemData.name} to database with id ${doc.id}`);

		return doc.id;
	}
}