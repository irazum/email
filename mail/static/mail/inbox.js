document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

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

  // Show the mailbox name
  //document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    document.querySelector('#emails-view > h3').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // send request to server and replace emails on html to received emails from json data (my c)
  fetch(`/emails/${mailbox}/`)
  .then(response => response.json())
  .then(emails => emails_data_handler(emails, mailbox))
}

// used in load_mailbox
function emails_data_handler(emails, mailbox) {
    // create new table element
    const table = document.createElement('table');
    table.className = 'table'
    // add each email like a row in the new table element
    emails.forEach(element => {
        // create the table row
        const tr = document.createElement('tr');
        // append read data in tr and change background-color
        //tr.setAttribute("data-read", element['read']);
        if (element['read']) {
            tr.style.backgroundColor = 'grey';
        }
        console.log(element)

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
            data = element.recipients[0]
            element.recipients.slice(1).forEach(recipient => {
                data += `, ${recipient}`
            })
            td.innerHTML = data
        }
        else {
            td.innerHTML = element[name];
        }

        tr.appendChild(td);
    }
}


function email_click_handler(id) {
    console.log(`this is ${id}`);
}