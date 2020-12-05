/*
     Project    : PlayBox  HTML, CSS, Javascript
     Description: This library helps to displays images and videos by filling the screen, and dimming out the web page
     Created by : K. Deepak Kumar
     Contact at : deepakplay14@gmail.com
*/

"use strict";
$(document).ready(function(){
    //Local Storage State Management using JSON
    const stateManagement = (function(){
        const read = function(){
            const storage = localStorage.getItem('state');
            if(storage){
                return JSON.parse(storage);
            }
            return {cart:[]};
        }

        const write = function(obj){
            localStorage.setItem('state', JSON.stringify(obj));
        }

        const addCartItem = function(obj){
            const storage = read();
            storage.cart.push(obj);
            write(storage);
        }

        const getCartItems = function(){
            const storage = read();
            return storage.cart;
        }

        const deleteCartItem = function(itemID){
            const storage = read();
            const index = storage.cart.findIndex(item=>item.id===itemID);
            if(index>=0){
                storage.cart.splice(index,1);
                write(storage);
            }
        }

        const deleteCartAll = function(){
            const storage = read();
            storage.cart = [];
            write(storage);
        }

        const check = function(itemID){
            const storage = read();
            return storage.cart.some(item=>item.id===itemID);
        }

        const updateQty = function(itemID, qty){
            const storage = read();
            const index = storage.cart.findIndex(item=>item.id===itemID);
            if(index>=0){
                storage.cart[index].qty = parseInt(qty);
                write(storage);
            }
        }

        const getItem = function(itemID){
            const storage = read();
            const item = storage.cart.find(item=>item.id===itemID);
            if(item){
                return item;
            }
            return false;
        }

        return {
            addItem: addCartItem,
            getItem: getItem,
            getAllItem: getCartItems,
            deleteItem: deleteCartItem,
            deleteAll: deleteCartAll,
            updateQty: updateQty,
            checkId: check,
        }
    })();

    //Cart Update functions
    const updateCart = function(id){
        const item = stateManagement.getItem(id);
        if(item){
            $(`tr[data-id=${id}] .item-price span`).text(item.qty*item.cost);
        }
        updateTotal()
    }
        
    const updateTotal = function(){
        $('.checkout .amount span').text(stateManagement.getAllItem().reduce((total,val)=>total+(val.cost*val.qty),0));
    }

    //AJAX Api Controller
    const apiController = (function(){
        const stringSlicer = function(str, len){
            if(str.length>len){
                return str.slice(0, len)+ '...';
            }
            return str;
        }

        const showResult = function(item='pizza'){
            let apiURL = `https://forkify-api.herokuapp.com/api/search?q=${item}`;
            $.ajax({  //api request using ajax
                url: apiURL,
                dataType: 'json',
                success:(response)=>{
                            const result = $('.searchResult');
                            result.empty();
                            response.recipes.forEach(item => {
                                if(!(/https:/.test(item.image_url))){
                                    item.image_url = item.image_url.replace('http:','https:');
                                };
                                let html = `
                                <div class="item" data-id=${item.recipe_id}>
                                    <img src="${item.image_url}" alt="${item.title}">
                                    <h3 class="item-title">${stringSlicer(item.title, 22)}</h3>
                                    <span class="item_cost">Rs ${Math.floor(Math.random()*300)}</span>
                                    <button class="add_to_cart"><i class="fas fa-shopping-cart"></i>&nbsp; Add</button>
                                </div>
                                `
                                result.append(html);
                            });
                        },
                error:(response)=>{
                            const result = $('.searchResult');
                            result.empty()
                            try{
                                let errorMsg = response.responseJSON.error;
                                $(`<div class="error">${errorMsg}</div>`).hide().appendTo(result).slideDown(200).css("display","inline-block");
                            }catch{
                                $(`<div class="error">Couldn't connect to the API</div>`).hide().appendTo(result).slideDown(200).css("display","inline-block");
                            }
                        },
                complete:()=>{
                            $('.loader').fadeOut(100);
                        },
            });
        }

        return {
            showResult:showResult
        }
    })();  

    // Search Button click event handler
    const buttonClicked = function(e){
        if(e.type ==="click" || e.which ===13){
            const value= $('#itemSearch');
            const result = $('.searchResult');
            if(value.val()!==''){
                $('.loader').fadeIn(100);
                apiController.showResult(value.val());
            }else{
                result.empty()
                $(`<div class="error">Enter the value in search</div>`).hide().appendTo(result).slideDown(200).css("display","inline-block");
            }
            value.val('');
            value.focus();
        }
    }
    
    $(document).keypress(buttonClicked); // Event Handlers for Search Button
    $('#itemSearchButton').click(buttonClicked);

    //Item AddToCart Functions
    const addCartUI = function(obj){
        const cartTable = $('.cart_table');
        const cartCount = $('.cart_count');
        cartTable.append(`
            <tr data-id=${obj.id} class="cart-item">
                <td class="item-name">
                    <img src="${obj.img}" alt="${obj.fullTitle}">
                    <span class="item-title">${obj.title}</span>
                </td>
                <td class="item-qty"><input type="number" value=${obj.qty}></td>
                <td class="item-price">Rs <span>${obj.qty * obj.cost}</span></td>
                <td class="item-action"><button class="itemDelete">Delete</button></td>
            </tr>
        `);

        if(cartCount.text()!==''){
            cartCount.text(`(${parseInt(cartCount.text().replace(/[^\d]/g,''))+1})`);
        }else{
            
            cartCount.text('(1)');
        }
    }

    const addCart = function(obj){
        stateManagement.addItem(obj);
        addCartUI(obj);
    }
    
    $('.searchResult').click(function(e){  //Add to cart Event handlers
        let target = $(e.target);
        if(target.hasClass('add_to_cart') || target.parent().hasClass('add_to_cart')){
            target = target.closest('.item');
            if(!(stateManagement.checkId(target.data('id')))){
                const obj={
                    id: target.data('id'),
                    img: target.find('img').attr('src'),
                    fullTitle: target.find('img').attr('alt'),
                    title: target.find('.item-title').text(),
                    cost: parseInt(target.find('.item_cost').text().replace(/[^\d]/g,'')),
                    qty:1,
                }
                addCart(obj)
                updateTotal();
            }else{
                alert('Item Already added');
            }
            
        }
    });
    
    // Cart Item Event Handers and funcitons
    $('.cart_table').on('click input', function(e){
        let target = $(e.target);
        if(target.hasClass('itemDelete')){
            const cartCount = $('.cart_count');
            target = target.parent().parent();
            stateManagement.deleteItem(target.data('id'));
            target.fadeOut(200, function(){
                $(this).remove();
            })
            updateTotal();
            if(cartCount.text()!==''){
                const count = parseInt(cartCount.text().replace(/[^\d]/g,''));
                if(count!==1){
                    cartCount.text(`(${count-1})`);
                }else{
                    cartCount.text('');
                }
                
            }
        }else if(target.parent().hasClass('item-qty') && e.type==='input'){
            const item = target.closest('.cart-item').data('id');
            if(target.val()<1 || isNaN(target.val())) target.val(1);
            stateManagement.updateQty(item, target.val());
            updateCart(item);
        }
    });

    // Checkout Buttom Handler    
    $('.checkout_btn').click(function(e){
        if(!(stateManagement.getAllItem().length)){
            alert('Cart is empty');
        }else{
            alert('Check out complete');
            stateManagement.deleteAll();
            location.reload();
        };
    });

    //Init Statements and functions
    stateManagement.getAllItem().forEach(objItem=>{
        addCartUI(objItem);
    });
    updateTotal();
     
    // PlayBox Button Target Setup
    PlayBox('.cartBox-open','.cartBox');
    PlayBox('.about-open','.about');
    
    // Responsive Navigation bar
    $('.mobile_menu').click(function(){ // Open Menu in mobile view
        $('header nav ul').slideDown(300);
    });

    $('.menu_close').click(function(){ // Close Menu in mobile view
        $('header nav ul').slideUp(300, function(){
            $('header nav ul').removeAttr('style');
        });    
    })

    $(window).resize(function(size){ // Close menu when resizing window
        if($(window).width()>=720){
            if($('header nav ul')[0].hasAttribute("style")){
                $('header nav ul').removeAttr('style');   
            };
        };
    })
})