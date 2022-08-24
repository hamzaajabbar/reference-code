import { client } from 'lib/api';
import { getId, getCodename, getTheme } from 'lib/shared';
import { getMeta } from 'lib/blocks/Search';

const showInNav = link => {
	return link.elements.show_in_navigation.value.length > 0 ? true : false;
};

export const getNav = links => {
	const items = links
		.map(link => {
			if (link.system.type === 'menu_category' && showInNav(link)) {
				const data = {
					text: link.elements.title.value,
					description: link.elements.description.value,
					links: getNav(link.elements.subpages.linkedItems),
					type: link.system.type,
					id: link.system.id,
					style: link.elements.style.value[0]?.codename || null,
					col: parseInt(link.elements.col.value[0]?.name),
					split: link.elements.split.value[0]?.codename === 'true',
				};
				return data;
			}
			if (link.system.type === 'page' && showInNav(link)) {
				const data = {
					text: link.elements.title.value,
					cta_text: link.elements.description.value,
					url: link.elements.url_slug.value,
					type: link.system.type,
					id: link.system.id,
					icon: link.elements.media.linkedItems[0]?.elements.desktop.value[0].url || null,
				};
				return data;
			}
			if (link.system.type === 'link') {
				const data = {
					text: link.elements.text.value,
					url: link.elements.url.value,
					type: link.system.type,
					id: link.system.id,
				};
				return data;
			}
		})
		.filter(link => link !== undefined);

	return items;
};

export const getLayout = async arg => {
	const navbar = await client
		.item('edwards')
		.queryConfig({
			usePreviewMode: arg,
		})
		.elementsParameter([
			'subpages',
			'title',
			'description',
			'show_in_navigation',
			'style',
			'col',
			'split',
			'url_slug',
			'media',
			'desktop',
			'link',
			'url',
			'text',
		])
		.depthParameter(3)
		.toPromise()
		.then(result => {
			return getNav(result.data.item.elements.subpages.linkedItems);
		});
	const footer = await client
		.item('edwards_footer')
		.queryConfig({
			usePreviewMode: arg,
		})
		.elementsParameter([
			'footer',
			'social_text',
			'social_links',
			'countries',
			'footer_categories',
			'copyright',
			'bottom_links',
			'title',
			'links',
			'url',
			'icon',
			'url_slug',
			'variant',
			'theme',
			'footer_title',
			'footer_column',
		])
		.depthParameter(4)
		.toPromise()
		.then(result => result.data.item);

	const searchMeta = await client
		.items()
		.queryConfig({
			usePreviewMode: arg,
		})
		.elementsParameter(['placeholder'])
		.type('search')
		.depthParameter(0)
		.toPromise()
		.then(result => getMeta(result?.data?.items[0]));
	return { navbar, footer, searchMeta };
};

export const getFooter = ({ elements, system }) => {
	const data = {
		...getId(system),
		...getCodename(system),
		...getTheme(elements),
		copyright: elements.copyright.value,
		social_text: elements.social_text.value,
		countries: elements.countries.value.map(country => {
			const url_slug = country.codename.replace('country_', '').replace('_', '-');
			return {
				id: url_slug,
				title: country.name,
			};
		}),
		categories: elements.footer_categories.linkedItems.map(category => {
			return {
				id: category.system.id,
				codename: category.system.codename,
				title: category.elements.title.value,
				links: category.elements.links.linkedItems.map(link => {
					return {
						title: link.elements.footer_title.value
							? link.elements.footer_title.value
							: link.elements.title.value,
						url: link.elements.url_slug.value,
						col: parseInt(link.elements?.footer_column.value[0]?.codename.replace('n', '') || 1),
					};
				}),
			};
		}),
		social_links: elements.social_links.linkedItems.map(link => {
			return {
				url: link.elements.url.value,
				icon: link.elements.icon.value,
			};
		}),
		bottom_links: elements.bottom_links.linkedItems.map(link => {
			return {
				url: link.elements.url_slug.value,
				text: link.elements.title.value,
			};
		}),
	};
	return data;
};
