document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email(event, email=false) {

  // Show compose view and hide other views
  console.log(email);

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields or fill in for reply-button
  if (email === false) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  else {
    document.querySelector('#compose-recipients').value = email.sender;
    if (email.subject.slice(0, 3) !== "Re:") {
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    else document.querySelector('#compose-subject').value = email.subject;
    body = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n`
    document.querySelector('#compose-body').value = body;
  }

  // submit handler (my c)
  document.querySelector('#compose-form').onsubmit = compose_submit_handler;
}

// used in compose_email
function compose_submit_handler() {
  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
  .then(response => response.json())
  .then(result => {
  // Print result
    console.log(result);
  })
  // Catch any errors and log them to the console
  .catch(error => {
    console.log('Error:', error);
    });
  //load mailbox
  load_mailbox('sent')
  // Prevent default submission
  return false;
}


function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Show the mailbox name
  //document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    document.querySelector('#emails-view > h3').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // send request to server and replace emails on html to received emails from json data (my c)
  fetch(`/emails/${mailbox}/`)
  .then(response => response.json())
  .then(emails => emails_data_handler(emails, mailbox))
  .catch(error => {
    console.log('Error:', error);
    });
}

// used in load_mailbox
function emails_data_handler(emails, mailbox) {
    // create new table element
    const table = document.createElement('table');
    table.className = 'table'
    // add each email like a row in the new table element
    emails.forEach(element => {
        // create the table row
        const tr = create_table_row(element['read']);
        // fill in the tr with data
        if (mailbox == 'inbox' || mailbox == 'archive') {
            inbox_handler(tr, element)
        }
        else if (mailbox == 'sent') {
            sent_handler(tr, element)
        }

        // add Event handler to the row
        tr.addEventListener('click', (event, email_id=element['id']) => email_click_handler(email_id));
        // append table row in new table element
        table.appendChild(tr);
    })
    // replace emails data
    let item = document.querySelector('#emails-container');
    item.replaceChild(table, item.firstChild);

}


// return table row element
function create_table_row(read) {
    const tr = document.createElement('tr');
    // append email mark element in tr
    tr.appendChild(email_mark_element());
    // append read data in tr and change background-color
    if (read) {
        tr.style.backgroundColor = 'grey';
        tr.setAttribute('data-backgroundColor', 'grey');
    }
    else {
        tr.setAttribute('data-backgroundColor', 'white');
    }
    return tr
}


// return td mark element
function email_mark_element() {
    td = document.createElement('td');
    td.innerHTML = "&#9744;";
    td.setAttribute('data-click', 0);
    td.addEventListener('click', (event) => {
        mark = event.currentTarget;
        if (mark.getAttribute('data-click') == 1) {
            // change icon and data-click attribute
            mark.setAttribute('data-click', 0);
            mark.innerHTML = "&#9745;";
            // change color marked row
            mark.parentElement.style.backgroundColor = 'blue';
            // hide top navbar?
        }
        else {
            // change icon and data-click attribute
            mark.setAttribute('data-click', 1);
            mark.innerHTML = "&#9744;";
            // back color marked row
            mark.parentElement.style.backgroundColor = mark.parentElement.getAttribute('data-backgroundColor');
            //show top navbar and put data
        }
        // stop event
        event.stopPropagation()
    })
    return td
}


// used in emails_data_handler
function inbox_handler(tr, element) {
    // create td elements and append its in the row
    const names = ['sender', 'subject', 'timestamp'];
    for (const name of names) {
        td = document.createElement('td');
        td.className = name;
        td.innerHTML = element[name];
        tr.appendChild(td);
    }
}


// used in emails_data_handler
function sent_handler(tr, element) {
    // create td elements and append its in the row
    const names = ['recipients', 'subject', 'timestamp'];
    for (const name of names) {
        td = document.createElement('td');
        td.className = name;
        if (name == 'recipients') {
            // create recipients-string
            td.innerHTML = `to: ${element.recipients.join(', ')}`;
        }
        else {
            td.innerHTML = element[name];
        }
        tr.appendChild(td);
    }
}


// used in emails_data_handler
function email_click_handler(id) {
    //hide and show blocks
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'block';
    // send request to server
    fetch(`/emails/${id}/`)
    .then(request => request.json())
    .then(email => {
        // fill in view-email block
        document.querySelector('#email-head > h3').innerHTML = email.subject;
        document.querySelector('#email-head > div').innerHTML = email.timestamp;
        document.querySelector('#email-sender > h5').innerHTML = email.sender;
        document.querySelector('#email-recipients').innerHTML = `to: ${email.recipients.join(', ')}`;
        document.querySelector('#email-body').innerHTML = email.body;
        // reply handler
        document.querySelector('#reply-button').addEventListener(
            'click',
            (event, mail=email) => compose_email(event, mail)
        );
        // mark email as read
        email_read_marker(id);
    })
    .catch(error => {
    console.log('Error:', error);
    });
}


// put request on server that email read
function email_read_marker(id) {
    fetch(`/emails/${id}/`, {
        method: 'PUT',
        body: JSON.stringify({
            'read': true
        })
    })
    .catch(error => {
    console.log('Error:', error);
    });
}
