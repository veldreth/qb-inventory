fx_version 'cerulean'
game 'gta5'

description 'qb-inventory'
version '2.3'

shared_scripts {
	'shared/config.lua',
	'shared/vehicles.lua',
	'shared/filter.lua',
	'shared/bin.lua',
	'shared/vending.lua',
	'shared/lang.lua',
	'shared/dropitems.lua',
	'@qb-weapons/config.lua'
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'server/main.lua',
	'server/visual.lua',
}

client_scripts {
	'client/main.lua',
	'client/visual.lua',
}


ui_page {
	'html/ui.html'
}

files {
	'html/ui.html',
	'html/css/main.css',
	'html/js/app.js',
	'html/images/*.svg',
	'html/images/*.png',
	'html/images/*.jpg',
	'html/inventory_images/*.png',
	'html/ammo_images/*.png',
	'html/attachment_images/*.png',
	'html/*.ttf'
}

dependencies {
    'ls-lib'
}

lua54 'yes'