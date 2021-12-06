  $(document).ready(function() {
    const identification = $('<section class="viewport2 start_identification start_identification_phone" style="position: absolute; top: 0; left: 0;">           Identification       <input type="text" id="phone_number" />       <button type="button" id="phone_set">Continue</button>   </section>');
    $('body').append(identification);
    const identification_verify = $('<section class="viewport2 start_identification start_identification_verify" style="position: absolute; top: 0; left: 0;">           Verify identification       <input type="text" id="phone_verify_code" />       <button type="button" id="phone_verify">Verify</button>   </section>');
    $('body').append(identification_verify);
    const identification_keyboard = $('<section class="viewport2 start_identification start_identification_keyboard" style="position: absolute; top: 50px; left: 0;">           Keyboard       </section>');
    $('body').append(identification_keyboard);
    const identification_redeem = $('<section class="viewport2 start_identification start_identification_redeem" style="position: absolute; bottom: 50px; right: 50px; width:100vh; text-align: right;"> <button id="phone_redeem">Redeem</button> </div>');
    $('body').append(identification_redeem);
    const identification_data = $('<section class="viewport2 start_identification start_identification_data" style="position: absolute; top: 0; left: 0; text-align: center; background-color: limegreen"> <h2>Client info</h2> <div "info_cash_in">Available cash in: <span id="info_cash_in_value"></span></div> <div id="info_cash_out">Available cash out: <span id="info_cash_out_value"></span></div> <button id="phone_start">Start</button> </div>');
    $('body').append(identification_data);
    
//    $('#coin-redeem-button').enableNativeEvent('mouseup');
    
    let verify_code = '';
    let verify_verified_status = 'none';
    let verify_timeout_counter = 0;
    let verify_phonenumber = '';
    let verify_laststate = '';
    let verify_stop = false;
    let verify_limit_cash_in = false;
    let verify_limit_cash_out = false;

    function phone_number_check_crm() {
        verify_code = '';
        const number = $('#phone_number').val();
        if (number.length>0) {
            $.ajax({
                url: 'http://172.25.184.37/snazzybee.json?a=1',
                dataType: 'json'
            }).done(function(data) {
                verify_code = '123';
                verify_verified_status = 'waiting';
                verify_phonenumber = data.tel;
                verify_limit_cash_in = data.in;
                verify_limit_cash_out = data.out;
                $('#phone_number').val('');
                $('.start_identification_phone').hide();
                $('.start_identification_verify').show();
            }).fail(function(a,b,c) {
                console.log(a,b,c);
            });
        }
    }
    function phone_number_verify_crm() {
        if (verify_code.length==0) {
                $('.start_identification_phone').show();
                $('.start_identification_verify').hide();
                return;
        }
        if ($('#phone_verify_code').val()==verify_code) {
            $('#phone_verify_code').val('');
            verify_verified_status = 'data';
            $('.start_identification_verify').hide();
            if (verify_limit_cash_in === false) {
                $('#info_cash_in_value').text('No limit');
            } else {
                $('#info_cash_in_value').text(verify_limit_cash_in);
            }
            if (verify_limit_cash_out === false) {
                $('#info_cash_out_value').text('No limit');
            } else {
                $('#info_cash_out_value').text(verify_limit_cash_out);
            }
            $('.start_identification_data').show();
        } else {
            alert('bad');
        }
    }
    function phone_number_start() {
        verify_verified_status = 'verified';
        verify_timeout_counter = 0;
        phone_number_is_verified();
    }
    function phone_number_is_verified() {
        if (isKeepingState() || isRedeemState() || verify_verified_status=='verified') {
            $('.start_identification').hide();
            $('#view').show();
        } else if (verify_verified_status=='none') {
            $('#view').hide();
            $('.start_identification').hide();
            $('.start_identification:not(.start_identification_verify):not(.start_identification_data)').show();
        } else if (verify_verified_status=='waiting') {
            $('#view').hide();
            $('.start_identification').hide();
            $('.start_identification:not(.start_identification_phone):not(.start_identification_data)').show();
        } else if (verify_verified_status=='data') {
            $('#view').hide();
            $('.start_identification').hide();
            $('.start_identification_data').show();
        }
    }
    for(let i=0;i<=9;i++) {
        $('.start_identification_keyboard').append($('<button id="phone_'+i+'" class="phone_button" data-digit="'+i+'">'+i+'</button>'));
    }
    $('.start_identification_keyboard').append($('<button id="phone_del" class="phone_button" data-digit="back">&lt;</button>')); 
    $('.phone_button').click(function() { 
        const digit = $(this).data('digit');
        let input = null;
        if ($('.start_identification').css('display')!='none') {
            input = $('#phone_number');
        } else if ($('.start_identification_verify').css('display')!='none') {
            input = $('#phone_verify_code');
        } else {
            return;
        }
        if (digit=='back') {
            const length = input.val().length;
            if (length>0) {
                input.val(input.val().substring(0,length-1));
            }
        } else {
            input.val(input.val() + digit.toString());
        }
    });
    $('#phone_start').click(phone_number_start);
    function phone_redeem() {
//        verify_stop=true;
        verify_verified_status = 'redeem';
        document.getElementById('coin-redeem-button').dispatchEvent(new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true } ));
        verify_verified_status = 'redeem';
    }
    $('#phone_set').click(phone_number_check_crm);
    $('#phone_verify').click(phone_number_verify_crm);
    $('#phone_redeem').click(phone_redeem);
//    $('#view').hide();
    $('.start_identification_verify').hide();
    const timeout = 100;
    function phone_number_timeout() {
//        console.log(window.currentState,verify_verified_status,verify_timeout_counter);
        if (isRedeemState() && isChooseCoinState()) {
            verify_timeout_counter++;
            if (verify_timeout_counter>3) {
                verify_verified_status='none';
                verify_timeout_counter=0;
            }
        }
        if (!isRedeemState()) {
            if (isKeepingState() || verify_timeout_counter>timeout) {
                verify_verified_status='none';
                verify_timeout_counter=0;
            }
        }
        if (verify_verified_status=='verified' || verify_verified_status=='data') {
            if (isChooseCoinState() || verify_verified_status=='data') {
                verify_timeout_counter++;
            } else {
                verify_timeout_counter = 0;
            }
        } else {
            phone_number_is_verified();
        }
        if (!verify_stop) {
            window.setTimeout(phone_number_timeout,timeout);
        }
    }
    function isKeepingState() {
        return $.inArray(window.currentState,[
            'booting',
            'trouble',
            'wairing',
            'fiat_error'
        ])!=-1
    }
    function isRedeemState() {
        return verify_verified_status=='redeem';
    }
    function isChooseCoinState() {
        return window.currentState=='choose_coin';
    }
    phone_number_timeout();
  });
