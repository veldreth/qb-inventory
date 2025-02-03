const { useQuasar } = Quasar
const { ref } = Vue

const app = Vue.createApp({
  setup () {
    return {
        options: ref(false),
        help: ref(false),
        showblur: ref(true),
    }
  },
  methods: {
    select: function(event) {
        targetId = event.currentTarget.id;
        showBlur()
    }
}
})

app.use(Quasar, { config: {} })
app.mount('#inventory-menus')

// function showBlur() {
//     $.post('https://qb-inventory/showBlur');
// }

function updateTextInput(value) {
    document.getElementById('item-amount-text').value = value;
}

var InventoryOption = "0, 0, 0";

var totalWeight = 0;
var totalWeightOther = 0;

var playerMaxWeight = 0;
var otherMaxWeight = 0;

var otherLabel = "";

var ClickedItemData = {};

var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;
var healthData = null;
var allWeapons = [];
var weaponsName = [];
var materialName = [];
var settingsName = [];
var foodsName = [];
var clothesName = [];

var IsDragging = false;

$(document).on("keydown", function() {
    if (event.repeat) {
        return;
    }
    switch (event.keyCode) {
        case 27: // ESC
        $('.health-system ').css('left', '-50%');
        $('.health-system').css('display', 'none');
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // TAB
            ControlPressed = true;
            break;
    }
});

$(document).on("dblclick", ".item-slot", function(e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: ItemData,
            })
        );
    }
});

$(document).on("keyup", function() {
    switch (event.keyCode) {
        case 17: // TAB
            ControlPressed = false;
            break;
    }
});

$(document).on("mouseenter", ".item-slot", function (e) {
    e.preventDefault();
    if($("#qbcore-inventory").css("display") == "block"){
        if ($(this).data("item") != null) {
            if ($('.item-shit').css('display') == 'none') {
                $(".ply-iteminfo-container").css('display', 'block');
                FormatItemInfo($(this).data("item"));
            } else {
                $(".ply-iteminfo-container").css('display', 'none');
                $('.item-shit').css('display', 'none');
                $('.item-info-description').css('display', 'block');

            }
            
        } else {
            if ($(this).data("item") != null && $('.item-shit').css('display') !== 'flex'){
                $(".ply-iteminfo-container").css('display', 'none');
                $('.item-shit').css('display', 'none');
                $('.item-info-description').css('display', 'block');
            }
        }
    }
});

$(document).on("mouseleave", ".item-slot", function(e){
    e.preventDefault();
    if ($('.item-shit').css('display') == 'none') {
        $(".ply-iteminfo-container").fadeOut(0)
        $('.item-shit').css('display', 'none');
        $('.item-info-description').css('display', 'block');
    }
});

// $(document).on("mousedown", function (event) {
//     switch (event.which) {
//         case 1:
//             if ($('.item-shit').css('display') !== 'none') {
//                 $(".ply-iteminfo-container").fadeOut(100);
//                 $('.item-shit').css('display', 'none');
//                 $('.item-info-description').css('display', 'block');
//             }
//         break;
//     }
// });

$(document).on("click", "#item-use", function(e) {
    if (contextMenuSelectedItem && ItemInventory) {
        Inventory.Close();
        $('.dropdown-content').removeClass('show-dropdown');
        $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: contextMenuSelectedItem,
            })
        );
    } else {
        console.log('contextMenuSelectedItem or ItemInventory is not set correctly');
    }
});

$(document).on("click", "#item-give", function(e) {
    if (contextMenuSelectedItem && ItemInventory) {
        var itemamt = document.getElementById('item-amount-text').value
        Inventory.Close();
        $.post(
            "https://qb-inventory/GiveItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: contextMenuSelectedItem,
                itemamt: itemamt
            })
        );
    } else {
        console.log('contextMenuSelectedItem or ItemInventory is not set correctly');
    }
});

$("#item-use").droppable({
    hoverClass: "button-hover",
    drop: function(event, ui) {
        setTimeout(function() {
            IsDragging = false;
        }, 300);
        fromData = ui.draggable.data("item");
        fromInventory = ui.draggable.parent().attr("data-inventory");
        if (fromData.useable) {
            if (fromData.shouldClose) {
                Inventory.Close();
            }
            $.post(
                "https://qb-inventory/UseItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                })
            );
        }
    },
});

$("#item-give").droppable({
    hoverClass: "button-hover",
    drop: function(event, ui) {
        setTimeout(function() {
            IsDragging = false;
        }, 300);
        fromData = ui.draggable.data("item");
        fromInventory = ui.draggable.parent().attr("data-inventory");
        amount = $("#item-amount").val();
        if (amount == 0) {
            amount = fromData.amount;
        }
        $.post(
            "https://qb-inventory/GiveItem",
            JSON.stringify({
                inventory: fromInventory,
                item: fromData,
                amount: parseInt(amount),
            })
        );
    },
});

var contextMenuSelectedItem = null;
var ItemInventory = null;
$('#item-split').click(function() {
    var currentValue = $('#item-amount').val();
    var newValue = Math.floor(currentValue / 2);
    $('#item-amount').val(newValue);
    $('#item-amount-text').val(newValue);
});

$('#item-amount-text').on('input', function() {
    var currentValue = $(this).val();
    if (currentValue >= 0 && currentValue <= $('#item-amount').attr('max')) {
        $('#item-amount').val(currentValue);
    } else {
        $(this).val($('#item-amount').attr('max'));
        $('#item-amount').val($('#item-amount').attr('max'));
    }
});

$('#item-amount-text').on('keydown', function(e) {
    var currentValue = parseInt($(this).val());
    if (e.which === 38) {
        var newValue = currentValue + 1;
        if (newValue >= 0 && newValue <= $('#item-amount').attr('max')) {
            $('#item-amount').val(newValue);
            $(this).val(newValue);
        }
    }
    else if (e.which === 40) {
        var newValue = currentValue - 1;
        if (newValue >= 0 && newValue <= $('#item-amount').attr('max')) {
            $('#item-amount').val(newValue);
            $(this).val(newValue);
        }
    }
});

var itemAmountInput = document.getElementById('item-amount');
disableDecimalInput(itemAmountInput);

function disableDecimalInput(input) {
    input.addEventListener('keydown', function(event) {
      if (event.key === '.' || event.key === 'Decimal') {
        event.preventDefault();
      }
    });
  }


function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find(".item-slot"), function (i, slot) {
        if ($(slot).data("item") === undefined) {
            if (retval === null) {
                retval = i + 1;
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;

    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }

    return retval;
}

$(document).on("click", "#inv-close", function(e) {
    e.preventDefault();
    Inventory.Close();
});

// function changeInventoryColor(color) {
//     $( ".player-inventory-bg" ).css( "background-color", color);
//     $( ".other-inventory-bg" ).css( "background-color", color);
//     $( ".inv-options" ).css( "background-color", color);
//     localStorage.setItem('qb-inventory-color', color);
// }

// const savedColor = localStorage.getItem('qb-inventory-color');

// if (savedColor) {
//     changeInventoryColor(savedColor)
// }

// $('#favcolor').change(function(){
//     let color = $(this).val();
//     let hexOpacity = "CC";
//     let finalColor = color+hexOpacity;
//     changeInventoryColor(finalColor);
// });

function getGender(info) {
    return info.gender === 1 ? "Woman" : "Man";
}

function setItemInfo(title, description) {
    $(".item-info-title").html(`<p>${title}</p>`);
    $(".item-info-description").html(description);
}

function generateDescription(itemData) {
    if (itemData.type === "weapon") {
        let ammo = itemData.info.ammo ?? 0;
        return `<p><strong>Name : </strong><span>${itemData.info.serie}</span></p>
                    <p><strong>Ammunition: </strong><span>${ammo}</span></p>
                    <p>${itemData.description}</p>`;
    }

    if (itemData.name == "phone" && itemData.info.lbPhoneNumber) {
        return `<p><strong>Phone Number: </strong><span>${itemData.info.lbFormattedNumber ?? itemData.info.lbPhoneNumber}</span></p>`;
    }

    switch (itemData.name) {
        case "id_card":
            return `<p><strong>CSN: </strong><span>${itemData.info.citizenid}</span></p>
              <p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
              <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
              <p><strong>Birth Date: </strong><span>${itemData.info.birthdate}</span></p>
              <p><strong>Gender: </strong><span>${getGender(itemData.info)}</span></p>
              <p><strong>Nationality: </strong><span>${itemData.info.nationality}</span></p>`;
        case "driver_license":
            return `<p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
            <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
            <p><strong>Birth Date: </strong><span>${itemData.info.birthdate}</span>
            </p><p><strong>Licenses: </strong><span>${itemData.info.type}</span></p>
            </p><p><strong>Endorsement: </strong><span>${itemData.info.endorsement}</span></p>`;
        case "zatweedbranch":
            return `<p><strong>Genetics: </strong><span>${itemData.info.genetics}</span></p>
            <p><strong>Purity: </strong><span>${itemData.info.purity}</span></p>
            <p><strong>Dry: </strong><span>${itemData.info.drylevel}</span></p>`;
        case "zatpackedweed":
            return `<p><strong>Purity: </strong><span>${itemData.info.purity}</span></p>`;
        case "zatjoint":
            return `<p><strong>Purity: </strong><span>${itemData.info.purity}</span></p>`;
            case "farm_water":
            if (itemData.info.water == undefined) {
                return `<p>water: 0%</p>`;
            }else{
                return `<p>water: ${itemData.info.water}%</p>`;
            }
        case "farm_seed_tomato":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_seed_corn":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_seed_sunflower":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_seed_carrot":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_seed_wheat":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_seed_onion":
            if (itemData.info.genetics == undefined) {
                return `<p>Genetics: ------</p>`;
            }else{
                return `<p>Genetics : ${itemData.info.genetics}</p>`;
            }
        case "farm_tomato":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_corn":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_sunflower":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_carrot":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_wheat":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_onion":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>
                <p>Rotten : 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>
                <p>Rotten : ${itemData.info.rotten}%</p>`;  
            }
        case "farm_tomato_comp":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_corn_comp":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_sunflower_comp":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_carrot_comp":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_carrot_wheat":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_onion_comp":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_tomato_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_corn_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_sunflower_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_carrot_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_wheat_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_onion_mash":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "farm_water_tap":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "moon_moonshine":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "moon_moonshine_pack":
            if (itemData.info.purity == undefined) {
                return `<p>Quality: 0%</p>`;  
            }else{
                return `<p>Quality: ${itemData.info.purity}%</p>`;  
            }
        case "zatgpu":
            return `<p>Type: ${itemData.info.type}</p>
            <p>Performance:${itemData.info.performance}%</p>
            <p>Freq:${itemData.info.hz}Ghz</p>`;  
        case "zatcpu":
            return `<p>Type: ${itemData.info.type}</p>
             <p>Performance:${itemData.info.performance}%</p>`;  
        case "zatmb":
            return `<p>Type: ${itemData.info.type}</p>
              <p>Performance:${itemData.info.performance}%</p>`;  
        case "zatps":
            return `<p>Type: ${itemData.info.type}</p>
              <p>Performance:${itemData.info.performance}%</p>`;
              case "snr_box":
                return `<p>Order ID: ${itemData.info.id}</p>`; 
            case "snr_strsmoothie":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`; 
            case "snr_rassmoothie":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bansmoothie":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bbrsmoothie":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_kiwsmoothie":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_stricecream":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bavicecream":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_vanicecream":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_manicecream":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_pisicecream":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_sprunk":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_sprunklight":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_ecola":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_eclight":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_fries":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_hamburger":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_cheburger":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_dchburger":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bbqburger":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_chiburger":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_thonsandwich":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_thontortilla":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_chiksandwich":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_chiktortilla":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bacosandwich":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bacotortilla":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_beeftacos":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_chictacos":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bacontacos":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_shrimpstacos":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_thonpizza":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_beefpizza":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_chicpizza":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_bacopizza":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_shripizza":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_nigirisushi":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_makisushi":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_uramakisushi":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_temarisushi":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_cherryccake":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_smileyccake":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_fnafccake":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_loveccake":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_rollccake":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_espressocoffee":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_cappucinocoffee":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_americanocoffee":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_macchiatocoffee":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_lattecoffee":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_thaisoup":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_cthainoodle":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_mthainoodle":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_vthainoodle":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_hotdogchicken":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_hotdogmeat":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_hotdocheese":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
            case "snr_hotdochilicheese":
                return `<p>Ingredients: ${itemData.info.ingredients}</p>`;
        case "weaponlicense":
            return `<p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>`;
        case "syphoningkit":
            return `<p><strong>A kit used to syphon gasoline from vehicles! </strong><span>${itemData.info.gasamount} Liters Inside.</span></p>`
        case "jerrycan":
            return `<p><strong>A Jerry Can, designed to hold fuel! </strong><span>${itemData.info.gasamount} Liters Inside.</span></p>`
        case "wateringcan":
            return `<p><strong>A Watering Can, designed to hold Water ! </strong><span>${itemData.info.durability} Liters Inside.</span></p>`
        case "harness":
            return `<p>${itemData.info.uses} uses left</p>`;
        case "lawyerpass":
            return `<p>Bar ID: ${itemData.info.baridnumber }</p>
            <p> Full Name: ${itemData.info.lawyername }</p>`;
        case "srecuritycard":
            return `<p><strong> Code: " ${itemData.info.code} "</p>`;
            case "blueprint":
                return `<p>Type : ${itemData.info.type}</p>`;
        case "filled_evidence_bag":
            if (itemData.info.type == "casing") {
            return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Type number: </strong><span>${itemData.info.ammotype}</span></p>
                <p><strong>Caliber: </strong><span>${itemData.info.ammolabel}</span></p>
                <p><strong>Serial Number: </strong><span>${itemData.info.serie}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            } else if (itemData.info.type == "blood") {
            return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Blood type: </strong><span>${itemData.info.bloodtype}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            } else if (itemData.info.type == "fingerprint") {
            return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Fingerprint: </strong><span>${itemData.info.fingerprint}</span></p>
                <p><strong>Crime Scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            } else if (itemData.info.type == "dna") {
            return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p><br /><p>${itemData.description}</p>`;
            }
            case "stickynote":
                return `<p>${itemData.info.label}</p>`;
            case "moneybag":
                return `<p><strong>Amount of cash: </strong><span>$${itemData.info.cash}</span></p>`;
            case "markedbills":
                return `<p><strong>Worth: </strong><span>$${itemData.info.worth}</span></p>`;
            case "visa":
                return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
            case "mastercard":
                return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
            case "labkey":
                return `<p>Lab: ${itemData.info.lab}</p>`;
            default:
                let itemDescr = itemData.description;
            if (itemData.info.costs != undefined && itemData.info.costs != null) itemDescr += `<p><strong>ITEMS NEEDED:</strong> <span>${itemData.info.costs}</span></p>`;
                return itemDescr;
        }
    }

function FormatItemInfo(itemData, mouse) {
    if (itemData && itemData.info !== "") {
        const description = generateDescription(itemData);
        $('.item-uselessinfo-weight').html(`<i class="fa-solid fa-weight-hanging"></i> ${((itemData.weight * itemData.amount / 1000))}KG`)
        $('.item-uselessinfo-decay').html(`<i class="fa fa-wrench"></i> ${(Math.floor(itemData.info?.quality || 0))}%`)
        setItemInfo(itemData.label, description, mouse);
    } else {
        setItemInfo(itemData.label, itemData.description || "", mouse);
    }
}

// $(document).click(function(event) {
//     var rightClickMenu = $(".ply-iteminfo-container");
//     if (!rightClickMenu.is(event.target) && rightClickMenu.has(event.target).length === 0) {
//         rightClickMenu.fadeOut(100);
//     }
// });

$(document).on("contextmenu", ".item-slot", function (event) {
    switch (event.which) {
        case 1:
            fromInventory = $(this).parent();
            if ($(fromInventory).attr("data-inventory") == "player") {
                if ($('.item-shit').css('display') == 'none') {
                    contextMenuSelectedItem = $(this).data("item");
                    ItemInventory = $(this).parent().attr("data-inventory"); 
                    $('.item-shit').css('display', 'flex');
                    $('#item-amount').show();
                    $('#item-amount-text').show();
                    $('.item-info-description').css('display', 'none');
                    $('#item-amount').attr('max', contextMenuSelectedItem.amount);
                    $('#item-amount').val(contextMenuSelectedItem.amount);
                    $('#item-amount-text').val(contextMenuSelectedItem.amount);
                } else {
                    $('#item-amount').val(0);
                    $('#item-amount-text').val(0);
                    $('.item-shit').css('display', 'none');
                    $('.item-info-description').css('display', 'none');
                    if ($(this).data('item') != undefined) {
                        FormatItemInfo($(this).data("item"));
                    }
                }
            }
        break 
        case 3:
            if (event.shiftKey) {
                fromSlot = $(this).attr("data-slot");
                fromInventory = $(this).parent();
                if ($(fromInventory).attr("data-inventory") == "player") {
                    toInventory = $(".other-inventory");
                } else {
                    toInventory = $(".player-inventory");
                }
                toSlot = GetFirstFreeSlot(toInventory, $(this));
                if ($(this).data("item") === undefined) {
                    return;
                }
                toAmount = $("#item-amount").val() || $(this).data("item").amount;
                
                if (CanQuickMove()) {
                    if (toSlot === null) {
                        InventoryError(fromInventory, fromSlot);
                        return;
                    }
                    if (fromSlot == toSlot && fromInventory == toInventory) {
                        return;
                    }
                    if (toAmount >= 0) {
                        if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                } else {
                    InventoryError(fromInventory, fromSlot);
                }
                break;
            } else {
                if ($('.item-shit').css('display') == 'none') {
                    $('.item-shit').css('display', 'flex');
                    $('.item-info-description').css('display', 'none');
                    selected_item = $(this)
                    selected_item_data = $(this).data("item")
                } else {
                    $('.item-shit').css('display', 'none');
                    $('.item-info-description').css('display', 'block');
                    if ($(this).data('item') != undefined) {
                        FormatItemInfo($(this).data("item"));
                    }
                }
            }
        }
    }
);

let lefty = 0
let topy = 0
$('body').mousemove(function (event) { 
    if ($('.item-shit').css('display') !== 'none') {return}
    topy = event.clientY
    lefty = event.clientX
    var howloooong = $('.ply-iteminfo-container').width();
    var howtaaaall = $('.ply-iteminfo-container').height()/2 > 70 ? $('.ply-iteminfo-container').height()/2 - 100 : $('.ply-iteminfo-container').height()/2 
    if (event.clientX < 1560) {
        datway = false
        $('.ply-iteminfo-container').css('left', (event.clientX+26)+'px').css('top', (event.clientY-howtaaaall)+'px')
    } else if (event.clientX >= 1560) {
        datway = true
        var howloooong = $('.ply-iteminfo-container').width();
        $('.ply-iteminfo-container').css('left', (event.clientX-howloooong-40)+'px').css('top', (event.clientY-howtaaaall)+'px')
    }
});

function handleDragDrop() {
    $(".item-drag").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function(event, ui) {
            IsDragging = true;
            // $(this).css("background", "rgba(20,20,20,1.0)");
            $(this).find("img").css("filter", "brightness(50%)");

            $(".ply-iteminfo-container").fadeOut(100);
            $('.item-shit').css('display', 'none');
            $('.item-info-description').css('display', 'block');

            //  $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");

            var itemData = $(this).data("item");
            var dragAmount = $("#item-amount").val();
            if (!itemData.useable) {
                // $("#item-use").css("background", "rgba(35,35,35, 0.5");
            }

            if (dragAmount == 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +
                            
                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else if (dragAmount > itemData.amount) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +
                            
                            " "
                        );
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else if (dragAmount > 0) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount -
                            dragAmount +
                            " " +
                            (
                                (itemData.weight * (itemData.amount - dragAmount)) /
                                1000
                            ).toFixed(1) +
                            " "
                        );
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            dragAmount +
                            " " +
                            
                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else {
                if ($(this).parent().attr("data-inventory") == "hotbar") {
                    // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                }
                $(".ui-draggable-dragging").find(".item-slot-key").remove();
                $(this)
                    .find(".item-slot-amount p")
                    .html(
                        itemData.amount +
                        " " +
                        
                        " "
                    );
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            }
        },
        stop: function() {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            $(this).css("background", "rgba(23, 27, 43, 0.5)");
            $(this).find("img").css("filter", "brightness(100%)");
            // $("#item-use").css("background", "rgba(" + InventoryOption + ", 0.3)");
        },
    });

    $(".item-slot").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromSlot = ui.draggable.attr("data-slot");
            fromInventory = ui.draggable.parent();
            toSlot = $(this).attr("data-slot");
            toInventory = $(this).parent();
            toAmount = $("#item-amount").val();

            var toDataUnique = toInventory.find("[data-slot=" + toSlot + "]").data("item");
            var fromDataUnique = fromInventory.find("[data-slot=" + fromSlot + "]").data("item");

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }
            if (toAmount >= 0) {
                if (!toDataUnique) {
                if (
                    updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                ) {
                    swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                }
                } else {
                    if (fromDataUnique.unique == toDataUnique.unique) {
                        if (!toDataUnique.combinable) {
                            if (
                                updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                            ) {
                                swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                            }
                        } else {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    } else {
                        if (
                            updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                        ) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                }
            }
        },
    });

    $("#item-use").droppable({
        hoverClass: "button-hover",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post(
                    "https://qb-inventory/UseItem",
                    JSON.stringify({
                        inventory: fromInventory,
                        item: fromData,
                    })
                );
            }
        },
    });

    $("#item-drop").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $(this).css("background", "rgba(35,35,35, 0.7");
            $.post(
                "https://qb-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
        },
    });
}

function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }
    if (
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "hotbar") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "hotbar")
    ) {
        return true;
    }
    if (
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop") ||
        ($fromInv.attr("data-inventory") == "crafting" &&
            $toInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toAmount == 0 &&
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" ||
            $fromInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toInv.attr("data-inventory").split("-")[0] == "itemshop" ||
        $toInv.attr("data-inventory") == "crafting"
    ) {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (toData == null || fromData.name == toData.name) {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
            }
        } else {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeight = totalWeight + toData.weight * toData.amount;

                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - toData.weight * toData.amount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeight = totalWeight - toData.weight * toData.amount;

                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + toData.weight * toData.amount;
            }
        }
    }

    if (
        totalWeight > playerMaxWeight ||
        (totalWeightOther > otherMaxWeight &&
            $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
            $fromInv.attr("data-inventory") != "crafting")
    ) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    var per =(totalWeight/1000)/(playerMaxWeight/100000)
    $(".pro").css("width",per+"%")
    $("#player-inv-weight").html(
        // '<i class="fas fa-dumbbell"></i> ' +
        (parseInt(totalWeight) / 1000).toFixed(1) + "kg / " +
        (playerMaxWeight / 1000).toFixed(1) + "kg"
    );
    if (
        $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $toInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $fromInv.attr("data-inventory") != "crafting" &&
        $toInv.attr("data-inventory") != "crafting"
    ) {
        $("#other-inv-label").html(otherLabel);
        $("#other-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (parseInt(totalWeightOther) / 1000).toFixed(1) + "kg / " +
            (otherMaxWeight / 1000).toFixed(1) + "kg"
        );
        var per1 =(totalWeightOther/1000)/(otherMaxWeight/100000)
        $(".pro1").css("width",per1+"%");
    }

    return true;
}

var combineslotData = null;

$(document).on("click", ".CombineItem", function(e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post(
            "https://qb-inventory/combineWithAnim",
            JSON.stringify({
                combineData: combineslotData.toData.combinable,
                usedItem: combineslotData.toData.name,
                requiredItem: combineslotData.fromData.name,
            })
        );
    } else {
        $.post(
            "https://qb-inventory/combineItem",
            JSON.stringify({
                reward: combineslotData.toData.combinable.reward,
                toItem: combineslotData.toData.name,
                fromItem: combineslotData.fromData.name,
            })
        );
    }
    Inventory.Close();
});

$(document).on("click", ".SwitchItem", function(e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(
        combineslotData.fromSlot,
        combineslotData.toSlot,
        combineslotData.fromInv,
        combineslotData.toInv,
        combineslotData.toAmount,
        combineslotData.toData,
        combineslotData.fromData
    );
});

function optionSwitch(
    $fromSlot,
    $toSlot,
    $fromInv,
    $toInv,
    $toAmount,
    toData,
    fromData
) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

    if ($toSlot < 6) {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $toSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    } else {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 6) {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $fromSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    } else {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    }

    $.post(
        "https://qb-inventory/SetInventoryData",
        JSON.stringify({
            fromInventory: $fromInv.attr("data-inventory"),
            toInventory: $toInv.attr("data-inventory"),
            fromSlot: $fromSlot,
            toSlot: $toSlot,
            fromAmount: $toAmount,
            toAmount: toData.amount,
        })
    );
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (fromData.unique && $toAmount > 1) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            ($fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar") &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            $toAmount == 0 &&
            $fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $fromInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (
            (toData != undefined || toData != null) &&
            toData.name == fromData.name &&
            !fromData.unique
        ) {
            var newData = [];
            newData.name = toData.name;
            newData.label = toData.label;
            newData.amount = parseInt($toAmount) + parseInt(toData.amount);
            newData.type = toData.type;
            newData.description = toData.description;
            newData.image = toData.image;
            newData.weight = toData.weight;
            newData.info = toData.info;
            newData.useable = toData.useable;
            newData.unique = toData.unique;
            newData.slot = parseInt($toSlot);

            if (newData.name == fromData.name) {
                if (newData.info.quality !== fromData.info.quality  ) {
                    InventoryError($fromInv, $fromSlot);
                    $.post(
                        "https://qb-inventory/Notify",
                        JSON.stringify({
                            message: "You can not stack items which are not the same quality.",
                            type: "error",
                        })
                    );
                    return;

                }
            }

            if (fromData.amount == $toAmount) {
                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newData.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 66 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                    if (newData.info.quality == undefined) {
                        newData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                        QualityColor = "rgb(127,82,0)";
                    } else if (newData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newData.info.quality !== undefined) {
                        qualityLabel = newData.info.quality.toFixed();
                    } else {
                        qualityLabel = newData.info.quality;
                    }
                    if (newData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .html(
                        '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                    );
            } else if (fromData.amount > $toAmount) {
                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel = '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel = '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' + newData.label + "</p></div>";
                //     }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 66 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                    if (newData.info.quality == undefined) {
                        newData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (newData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newData.info.quality !== undefined) {
                        qualityLabel = newData.info.quality.toFixed();
                    } else {
                        qualityLabel = newData.info.quality;
                    }
                    if (newData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                // From Data zooi
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name1"><p>' +
                            " £" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 66 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                        if (newDataFrom.info.quality == undefined) {
                            newDataFrom.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (newDataFrom.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newDataFrom.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (newDataFrom.info.quality !== undefined) {
                            qualityLabel = newDataFrom.info.quality.toFixed();
                        } else {
                            qualityLabel = newDataFrom.info.quality;
                        }
                        if (newDataFrom.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }
                        }
                    }
            $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            $.post(
                "https://qb-inventory/SetInventoryData",
                JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                })
            );
        } else {
            if (fromData.amount == $toAmount) {
                if (toData && toData.unique){
                    InventoryError($fromInv, $fromSlot);
                    return;
                }
                if (
                    toData != undefined &&
                    toData.combinable != null &&
                    isItemAllowed(fromData.name, toData.combinable.accept)
                ) {
                    $.post(
                        "https://qb-inventory/getCombineItem",
                        JSON.stringify({ item: toData.combinable.reward }),
                        function(item) {
                            $(".combine-option-text").html(
                                "<p>If you combine these items you get: <b>" +
                                item.label +
                                "</b></p>"
                            );
                        }
                    );
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = [];
                    combineslotData.fromData = fromData;
                    combineslotData.toData = toData;
                    combineslotData.fromSlot = $fromSlot;
                    combineslotData.toSlot = $toSlot;
                    combineslotData.fromInv = $fromInv;
                    combineslotData.toInv = $toInv;
                    combineslotData.toAmount = $toAmount;
                    return;
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + fromData.label + "</p></div>";
                // if (fromData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            fromData.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 66 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (fromData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(fromData.name)) {
                    if (fromData.info.quality == undefined) {
                        fromData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (fromData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (fromData.info.quality > 25 && fromData.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (fromData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (fromData.info.quality !== undefined) {
                        qualityLabel = fromData.info.quality.toFixed();
                    } else {
                        qualityLabel = fromData.info.quality;
                    }
                    if (fromData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + toData.label + "</p></div>";
                    // if (toData.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(toData.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                toData.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 66 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (toData.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(toData.name)) {
                        if (toData.info.quality == undefined) {
                            toData.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (toData.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (toData.info.quality > 25 && toData.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (toData.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (toData.info.quality !== undefined) {
                            qualityLabel = toData.info.quality.toFixed();
                        } else {
                            qualityLabel = toData.info.quality;
                        }
                        if (toData.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                            toAmount: toData.amount,
                        })
                    );
                } else {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else if (
                        $fromSlot == 66 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                        })
                    );
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            } else if (
                fromData.amount > $toAmount &&
                (toData == undefined || toData == null)
            ) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newDataTo.label + "</p></div>";
                // if (newDataTo.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newDataTo.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 66 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newDataTo.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                    if (newDataTo.info.quality == undefined) {
                        newDataTo.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newDataTo.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newDataTo.info.quality > 25 && newDataTo.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (newDataTo.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newDataTo.info.quality !== undefined) {
                        qualityLabel = newDataTo.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataTo.info.quality;
                    }
                    if (newDataTo.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name1"><p>' +
                            " £" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 66 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                        if (newDataFrom.info.quality == undefined) {
                            newDataFrom.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (newDataFrom.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newDataFrom.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (newDataFrom.info.quality !== undefined) {
                            qualityLabel = newDataFrom.info.quality.toFixed();
                        } else {
                            qualityLabel = newDataFrom.info.quality;
                        }
                        if (newDataFrom.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }
                        }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post(
                    "https://qb-inventory/SetInventoryData",
                    JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        fromAmount: $toAmount,
                    })
                );
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
        //InventoryError($fromInv, $fromSlot);
    }
    handleDragDrop();
}

function isItemAllowed(item, allowedItems) {
    var retval = false;
    $.each(allowedItems, function(index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval;
}

function InventoryError($elinv, $elslot) {
    $elinv
        .find("[data-slot=" + $elslot + "]")
        .css("background", "rgba(156, 20, 20, 0.5)")
        .css("transition", "background 500ms");
    setTimeout(function() {
        $elinv
            .find("[data-slot=" + $elslot + "]")
            .css("background", "rgba(255, 255, 255, 0.3)");
    }, 500);
    $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 30;
    Inventory.droplabel = "Ground";
    Inventory.dropmaxweight = 100000;

    Inventory.Error = function() {
        $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
    };

    Inventory.IsWeaponBlocked = function(WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed",
            "weapon_stickybomb",
        ];

        var retval = false;
        $.each(DurabilityBlockedWeapons, function(i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    };

    Inventory.QualityCheck = function (item, IsHotbar, IsOtherInventory) {
        // if (!Inventory.IsWeaponBlocked(item.name)) {
        //     if (item.name.split("_")[0] == "weapon") {
                if (item.info.quality == undefined) {
                    item.info.quality = 100;
                }
                var QualityColor = "rgb(127,82,0)";
                if (item.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (item.info.quality > 25 && item.info.quality < 50) {
                    QualityColor = "rgb(230, 126, 34)";
                } else if (item.info.quality >= 50) {
                    QualityColor = "rgb(127,82,0)";
                }
                if (item.info.quality !== undefined) {
                    qualityLabel = item.info.quality.toFixed();
                } else {
                    qualityLabel = item.info.quality;
                }
                if (item.info.quality == 0) {
                    qualityLabel = "BROKEN";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".ply-hotbar-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                height: "100%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                } else {
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }
            // }
        // }
    };

    Inventory.Open = function(data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $('.health-system ').css('left', '-50%');
        $('.health-system').css('display', 'none');
        $('.health-system ').css('left', '-50%');
        $('.health-system').css('display', 'none');
        $('.inventory-search-input-box').val('');
        $(".player-inv-label").html('Player');
        $(".player-inventory").find(".item-slot").remove();
        $(".player-inventory-backpack").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        $(".ply-iteminfo-container").css("display", "none");
        $('.item-shit').css('display', 'none');
        $('.item-info-description').css('display', 'block');

        $(".personal-vehicle-title").html('Personal Vehicle');
        $(".personal-vehicle").html('N/A');

        $(".player-id-title").html(data.pName);
        $(".player-id").html('Citizen ID: ' + data.pCID);

        $(".phone-number-title").html('Phone Number');
        $(".phone-number").html(data.pNumber);

        $(".apartment-id-apartment").html('N/A');
        if(data.apartment){
            $(".apartment-id-apartment").html("" + data.apartment.apartment_label + ", Room: " + data.apartment.room_id);
        }

        
    
        if (requiredItemOpen) {
            $(".requiredItem-container").hide();
            requiredItemOpen = false;
        }
    
        $("#qbcore-inventory , body").fadeIn(300);
        if (data.other != null && data.other != "") {
            $(".other-inventory").attr("data-inventory", data.other.name);
        } else {
            $(".other-inventory").attr("data-inventory", 0);
        }
        
        // First 5 Slots
        for (i = 1; i < 6; i++) {
            $(".player-inventory-backpack").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        
        var firstSlots = $(".player-inventory-first");
        var icons = ["fa-headphones", "fa-mask", "fa-glasses", "fa-shield-halved", "fa-clothes-hanger"];
        for (i = 16; i < 21; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"><div class="icon-container"><i class="fas ' +
                icons[i-16] + ' icon-style"></i></div></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var secondSlots = $(".player-inventory-second");
        var icons = ["fa-wallet", "fa-mobile-notch", "fa-key", "fa-credit-card", "fa-box-archive"];
            for (i = 21; i < 26; i++) {
            secondSlots.append(
                '<div class="item-slot" data-slot="' +
            i +
                '"><div class="item-slot-key"><p>' +
            i +
                '</p></div><div class="item-slot-img"><div class="icon-container"><i class="fas ' +
            icons[i-21] + ' icon-style"></i></div></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
        );
        $(".player-inventory").append(secondSlots);
    }
        
        var backpackSlots = $(".player-inventory-backpack");
        for (i = 6; i < 16; i++) {
            backpackSlots.append(
                '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        $(".player-inventory").append(backpackSlots);
        
        var remainingSlots = $(".player-inventory");
        for (i = 26; i < data.slots + 26; i++) {{
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);
        
        if (data.other != null && data.other != "") {
            for (i = 1; i < data.other.slots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        } else {
            for (i = 1; i < Inventory.dropslots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
            $(".other-inventory .item-slot").css({
                "background-color": "rgba(23, 27, 43, 0.5)",
            });
        }

        if (data.inventory !== null) {
            $.each(data.inventory, function(i, item) {
                if (item != null) {
                    totalWeight += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                        // $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-colorsss");
                        // if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";
                        // }
                    // }
                    if (item.slot < 6) {
                        // if (item.name.split("_")[0] == "weapon") {
                            // $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-colorsss");
                        // }
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="inv-item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else if (item.slot == 66) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="inv-item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if (
            data.other != null &&
            data.other != "" &&
            data.other.inventory != null
        ) {
            $.each(data.other.inventory, function(i, item) {
                if (item != null) {
                    totalWeightOther += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";
                        // }
                    // }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    if (item.price != null) {
                        $(".item-slot-name > p").css("display", "block");
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name1"><p>' +
                                " £" +
                                item.price +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount
                            );
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        var per =(totalWeight/1000)/(data.maxweight/100000)
        $(".pro").css("width",per+"%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000).toFixed(1) + "kg / " +
            (data.maxweight / 1000).toFixed(1) + "kg"
        );
        playerMaxWeight = data.maxweight;
        if (data.other != null) {
            var name = data.other.name.toString();
            if (
                name != null &&
                (name.split("-")[0] == "itemshop" || name == "crafting")
            ) {
                $("#other-inv-label").html(data.other.label);
            } else {
                $("#other-inv-label").html(data.other.label);
                $("#other-inv-weight").html(
                    // '<i class="fas fa-dumbbell"></i> ' +
                    (totalWeightOther / 1000).toFixed(1) + "kg / " +
                    (data.other.maxweight / 1000).toFixed(1) + "kg"
                );
            }
            otherMaxWeight = data.other.maxweight;
            otherLabel = data.other.label;
            var per1 =(totalWeightOther/1000)/(otherMaxWeight/100000)
            $(".pro1").css("width",per1+"%");
        } else {
            $("#other-inv-label").html(Inventory.droplabel);
            $("#other-inv-weight").html(
                // '<i class="fas fa-dumbbell"></i> ' +
                (totalWeightOther / 1000).toFixed(1) + "kg / " +
                (Inventory.dropmaxweight / 1000).toFixed(1) + "kg"
            );
            otherMaxWeight = Inventory.dropmaxweight;
            otherLabel = Inventory.droplabel;
            var per1 =(totalWeightOther/1000)/(otherMaxWeight/100000)
            $(".pro1").css("width",per1+"%");
        }

        $.each(data.maxammo, function(index, ammotype) {
            $("#" + index + "_ammo")
                .find(".ammo-box-amount")
                .css({ height: "0%" });
        });

        if (data.Ammo !== null) {
            $.each(data.Ammo, function(i, amount) {
                var Handler = i.split("_");
                var Type = Handler[1].toLowerCase();
                if (amount > data.maxammo[Type]) {
                    amount = data.maxammo[Type];
                }
                var Percentage = (amount / data.maxammo[Type]) * 100;

                $("#" + Type + "_ammo")
                    .find(".ammo-box-amount")
                    .css({ height: Percentage + "%" });
                $("#" + Type + "_ammo")
                    .find("span")
                    .html(amount);
            });
        }

        handleDragDrop();

        weaponsName = data["weapons"]
        settingsName = data.filter["settings"]
        foodsName = data.filter["foods"]
        clothesName = data.filter["clothes"]
        materialName = data.filter["materials"]

        $('.char-info').css('display', 'none');
        
        healthData = data.firstData;

        allWeapons = data.weaponsAll

        var woundColors = {
            Head: "rgba(255, 103, 103, {opacity})",
            Chest: "rgba(255, 103, 103, {opacity})",
            RArm: "rgba(255, 103, 103, {opacity})",
            LArm: "rgba(255, 103, 103, {opacity})",
            RKnee: "rgba(255, 103, 103, {opacity})",
            LKnee: "rgba(255, 103, 103, {opacity})"
        };

        Object.keys(woundColors).forEach(function(area) {
           var opacity = 100 - healthData[area].health;
           var color = woundColors[area].replace("{opacity}", opacity/100);
           $('.'+area).css("fill", color);
           $('.bar-'+area).css("width", healthData[area].health + "%" );
            $('.health-'+area).html(healthData[area].health + "%");
        })

    };

    $(document).ready(function() {
        $('.wound').hover(function() {
            var hover = $(this).data("type");
            var data = healthData[hover];
    
            data.bleeding = data.bleeding ? "Yes" : "No";
            data.severity = ["Low", "Medium", "High", "Critical"][data.severity];
            data.broken = data.broken ? "Yes" : "No";
    
            $('.bullets').html(data.health);
            $('.broken').html(data.broken);
            $('.severity').html(data.severity);
            $('.bleeding').html(data.bleeding);
    
            var woundPos = $(this).offset();
            var charInfo = $('.char-info');
            
            var leftPos = woundPos.left + $(this).width() + 10;
            var topPos = woundPos.top - (charInfo.height() / 2) + ($(this).height() / 2);
            
            charInfo.css({
                'display': 'block',
                'left': leftPos + 'px',
                'top': topPos + 200 + 'px'
            });
        }, function() {
            $('.char-info').css('display', 'none');
        });
    });



    var filter = false
$(document).on("click", ".item-box-list svg", function (e) {
    e.preventDefault();
    var item = $(this).data("type");
    var controller = false

    if (filter) {
        $(".player-inventory .item-slot").css('opacity', '1');
        filter = false;
        return;
    }

    var itemList;
    switch (item) {
        case "weaponsName":
            itemList = weaponsName;
            controller = true
            break;
        case "materialName":
            itemList = materialName;
            break;
        case "clothesName":
            itemList = clothesName;
            break;
        case "foodsName":
            itemList = foodsName;
            break;
        case "settingsName":
            itemList = settingsName;
            break;

        default:
            itemList = [];
            break;
    }
    $(".player-inventory .item-slot").each(function () {
        var html = $(this).find(".item-slot-label p").html().toLowerCase();
        var itemFound = false;

        if (controller) {
            if (html.indexOf("&nbsp;") === -1) {
                itemList.forEach(function(itemText) {
                    if (html.indexOf(itemText.toLowerCase()) !== -1) {
                        itemFound = true;
                    }
                });
            }
        }

        if (html.indexOf("&nbsp;") === -1 && !controller) {
            itemList.forEach(function(itemText) {
                if (html.indexOf(itemText.name.toLowerCase()) !== -1) {
                    itemFound = true;
                }
            });
        }

        if (!itemFound) {
            $(this).css('opacity', '0.3');
        } else {
            $(this).css('opacity', '1');
        }
    });

    filter = !filter;
});

$(document).on("click", ".settings-button", function (e) {
    if ($(this).data("type") == "settings") {
        $('.help-box').css('display', 'block');       
    }
})

$(document).on("click", "#MDRSTopDivRight", function (e) {
    Inventory.Close();
})

$(document).on("click", ".helpclose", function (e) {
    $('.help-box').css('display', 'none');       
})

    Inventory.Close = function() {
        // $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");
        $(".ply-hotbar-inventory").css("display", "block");
        // $(".ply-iteminfo-container").css("display", "none");
        $(".ply-iteminfo-container").css("display", "none");
        $('.item-shit').css('display', 'none');
        $('.item-info-description').css('display', 'block');
        $("#qbcore-inventory").fadeOut(300);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        if ($("#rob-money").length) {
            $("#rob-money").remove();
        }
        $.post("https://qb-inventory/CloseInventory", JSON.stringify({}));
    };

    Inventory.Update = function(data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".player-inventory-backpack").find(".item-slot").remove();
        $(".player-inventory-first").find(".item-slot").remove();
        $(".player-inventory-second").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }

        for (i = 1; i < 6; i++) {
            $(".player-inventory-backpack").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        
        var firstSlots = $(".player-inventory-first");
        var icons = ["fa-wallet", "fa-mobile-notch", "fa-key", "fa-credit-card", "fa-box-archive"];
        for (i = 16; i < 21; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"><div class="icon-container"><i class="fas ' +
                icons[i-16] + ' icon-style"></i></div></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var secondSlots = $(".player-inventory-second");
        // var icons = ["fa-wallet", "fa-mobile-notch", "fa-key", "fa-credit-card", "fa-box-archive"];
        var icons = ["fa-headphones", "fa-mask", "fa-glasses", "fa-shield-halved", "fa-clothes-hanger"];
            for (i = 21; i < 26; i++) {
            secondSlots.append(
                '<div class="item-slot" data-slot="' +
            i +
                '"><div class="item-slot-key"><p>' +
            i +
                '</p></div><div class="item-slot-img"><div class="icon-container"><i class="fas ' +
            icons[i-21] + ' icon-style"></i></div></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
        );
        $(".player-inventory").append(secondSlots);
    }
        
        var backpackSlots = $(".player-inventory-backpack");
        for (i = 6; i < 16; i++) {
            backpackSlots.append(
                '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        $(".player-inventory").append(backpackSlots);
        
        var remainingSlots = $(".player-inventory");
        for (i = 26; i < data.slots + 26; i++) {{
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);

        $.each(data.inventory, function(i, item) {
            if (item != null) {
                totalWeight += item.weight * item.amount;
                if (item.slot < 6) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            item.slot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else if (item.slot == 66) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                }
            }
        });

        var per =(totalWeight/1000)/(data.maxweight/100000)
        $(".pro").css("width",per+"%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000).toFixed(1) + "kg / " +
            (data.maxweight / 1000).toFixed(1) + "kg"
        );

        handleDragDrop();
    };

    Inventory.ToggleHotbar = function(data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 6; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div><img class="z-hot-img" src="svg/denemm.svg"></div>';
                $(".z-hotbar-inventory").append(elem);
            }
/*             var elem =
                '<div class="z-hotbar-item-slot" data-zhotbarslot="41"> <div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            $(".z-hotbar-inventory").append(elem); */
            $.each(data.items, function(i, item) {
                if (item != null) {
                    var ItemLabel =
                        '<div class="z-hotbar-item-label"><p>' +
                        item.label +
                        "</p></div>";

                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><img class="z-hot-img" src="svg/denemm.svg"><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );

                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function() {
                $(".z-hotbar-inventory").html("");
            });
        }
    };

    Inventory.UseItem = function(data) {
        $(".itembox-container").hide();
        $(".itembox-container").fadeIn(250);
        $("#itembox-action").html("<p>Used</p>");
        $("#itembox-label").html("<p>" + data.item.label + "</p>");
        $("#itembox-image").html(
            '<div class="item-slot-img"><img src="images/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        setTimeout(function() {
            $(".itembox-container").fadeOut(250);
        }, 2000);
    };

    var itemBoxtimer = null;
    var requiredTimeout = null;

    Inventory.itemBox = function(data) {
        if (itemBoxtimer !== null) {
            clearTimeout(itemBoxtimer);
        }
    
        var type = "Used " + "x" + data.itemAmount;
        if (data.type == "add") {
            type = "Received " + "x" + data.itemAmount;
        } else if (data.type == "remove") {
            type = "Removed " + "x" + data.itemAmount;
        }
    
        // Check if there's an existing item box
        var $existingItemBox = $(".itembox-container:not(.template)");
    
        if ($existingItemBox.length > 0) {
            // Update existing item box content
            $existingItemBox.find("#itembox-action p").text(type);
            $existingItemBox.find("#itembox-label p").text(data.item.label);
            $existingItemBox.find(".item-slot-img-itembox img").attr("src", "images/" + data.item.image).attr("alt", data.item.name);
        } else {
            // Create a new item box
            var $itembox = $(".itembox-container.template").clone();
            $itembox.removeClass("template");
            $itembox.html(
                '<div id="itembox-action"><p>' +
                type +
                '</p></div><div id="itembox-label"><p>' +
                data.item.label +
                '</p></div><div class="item-slot-img-itembox"><img src="images/' +
                data.item.image +
                '" alt="' +
                data.item.name +
                '" /></div>'
            );
            $(".itemboxes-container").prepend($itembox);
            $itembox.fadeIn(250);
        }
    
        // Show background
        $(".itemboxes-container-background").fadeIn(250);
    
        // Set timeout for removal
        setTimeout(function() {
            $(".itemboxes-container-background").fadeOut(300);
            $(".itembox-container:not(.template)").fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }; 

    Inventory.RequiredItem = function(data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout);
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function(index, item) {
                    var element =
                        '<div class="requiredItem-box"><div id="requiredItem-action">Required</div><div id="requiredItem-label"><p>' +
                        item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="images/' +
                        item.image +
                        '" alt="' +
                        item.name +
                        '" /></div></div></div>';
                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function() {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100);
        }
    };

    window.onload = function(e) {
        window.addEventListener("message", function(event) {
            switch (event.data.action) {
                case "open":
                    Inventory.Open(event.data);
                    break;
                case "close":
                    Inventory.Close();
                    break;
                case "update":
                    Inventory.Update(event.data);
                    break;
                case "itemBox":
                    Inventory.itemBox(event.data);
                    break;
                case "requiredItem":
                    Inventory.RequiredItem(event.data);
                    break;
                case "toggleHotbar":
                    Inventory.ToggleHotbar(event.data);
                    break;
                    case "health":
                        $(".health-system , body").css("display", "block");
                        $('body').css('background-color','transparent')
                        $(".health-system").animate({
                            left: "0%"
                        }, 1000);
                        $('.two-circle .text').html(event.data.playerDamage['label']);
                        $('.two-circle .number').html(event.data.playerDamage['count']);
                        break;
                        case "RobMoney":
                            $('#rob-money').css('display', 'block');
                            // $(".inv-options-list").append('<div class="inv-option-item" id="rob-money"><p>TAKE MONEY</p></div>');
                            $("#rob-money").data("TargetId", event.data.TargetId);
                            break;
            }
        });
    };
})();

$(document).on("click", "#rob-money", function(e) {
    e.preventDefault();
    var TargetId = $(this).data("TargetId");
    $.post(
        "https://qb-inventory/RobMoney",
        JSON.stringify({
            TargetId: TargetId,
        })
    );
    $("#rob-money").remove();
});

// Item Search  //

$(".invsearch-input").on("input", function () {
    var val = $(this).val().toLowerCase();

    $(".player-inventory .item-slot").each(function () {
        var html = $(this).find(".item-slot-label").html().toLowerCase();

        if (html.indexOf("&nbsp;") === -1) {
            if (html.indexOf(val) === -1) {
                $(this).css('opacity', '0.3');
            } else {
                $(this).css('opacity', '1');
            }
        }
    });
});