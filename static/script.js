document.addEventListener("DOMContentLoaded", function() {
    const isEmployeeDashboard = document.getElementById('tickets_container') !== null;
    fetchTickets(isEmployeeDashboard);
    const adminUniqueId = new URLSearchParams(window.location.search).get('unique_id');
    let adminUserId = null;
    function fetchAdminUserId() {
        fetch(`/get_admin_id/${adminUniqueId}`)
            .then(response => response.json())
            .then(data => {
                adminUserId = data.admin_id;
            });
    }
    fetchAdminUserId();

    // Fetch tickets from the server
    function fetchTickets(isEmployee, filter = 'all', search = '') {
        fetch(`/get_tickets?filter=${filter}&search=${search}`)
            .then(response => response.json())
            .then(data => {
                isEmployee ? displayEmployeeTickets(data.tickets) : displayAdminTickets(data.tickets);
                if (!isEmployee) {
                    updateTaskCounts(data.tickets);
                }
            });
    }
    
    fetchTickets(isEmployeeDashboard);

    // Function to handle filter change
    window.applyFilter = function() {
        const filterValue = document.getElementById('ticket_filter').value;
        fetchTickets(isEmployeeDashboard, filterValue);
    };
    window.applySearch = function() {
        const searchQuery = document.getElementById('ticket_search').value;
        fetchTickets(isEmployeeDashboard, 'all', searchQuery);
    };
    // Display tickets for employees
    function displayEmployeeTickets(tickets) {
        const container = document.getElementById('tickets_container');
        container.innerHTML = '';
        if (tickets.length === 0) {
            container.innerHTML = '<p>No entries are available.</p>';
            return;
        }
        tickets.forEach((ticket, index) => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            const ticketContentDiv = document.createElement('div');
            ticketContentDiv.className = 'ticket-content';
            ticketDiv.setAttribute('data-priority', ticket.priority);
            ticketDiv.setAttribute('data-completed', ticket.completed);
            let reopenedInfo = ticket.reopened_count ? `<p>Reopened Count: ${ticket.reopened_count}</p>` : ''; 
            ticketContentDiv.innerHTML = `<p>Submitted by: ${ticket.user_id}</p>
                                   <p>${ticket.content}</p>
                                   <p>${ticket.subject}</p>
                                   <p>${ticket.details}</p>
                                   <p>Priority: ${ticket.priority}</p>
                                   <p>Created: ${ticket.creation_time}</p>
                                   <p>Status: ${ticket.status}</p>`+ reopenedInfo +
                                   (ticket.completed && ticket.completion_time ? `<p>Completed: ${ticket.completion_time}</p>` : '');

            // Display comments from admins
            const commentsDiv = document.createElement('div');
            commentsDiv.className = 'comments';
            if (ticket.status === 'Completed') {
                const reopenButton = document.createElement('button');
                reopenButton.textContent = 'Reopen Ticket';
                reopenButton.className ="reopen"
                reopenButton.onclick = () => reopenTicket(ticket.content);
                ticketDiv.appendChild(reopenButton);
            }
            
            ticket.comments.forEach(comment => {
                const commentP = document.createElement('p');
                commentP.className = 'comment';
                commentP.textContent = `Admin ${comment.admin_id} commented on ${comment.timestamp}: ${comment.comment}`;
                commentsDiv.appendChild(commentP);
            });
            ticketDiv.appendChild(ticketContentDiv);
            ticketDiv.appendChild(commentsDiv);

            container.appendChild(ticketDiv);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => deleteTicket(ticket.content);
            ticketContentDiv.appendChild(deleteButton);

        container.appendChild(ticketDiv);
        });
    }

    // Display tickets for admins
    function displayAdminTickets(tickets) {
        const pendingContainer = document.getElementById('pending_tickets_container');
        const completedContainer = document.getElementById('completed_tickets_container');
        const reopenedContainer = document.getElementById('reopened_tickets_container');
        reopenedContainer.innerHTML = '';
        pendingContainer.innerHTML = '';
        completedContainer.innerHTML = '';
        if (tickets.length === 0) {
            const noEntriesMsg = document.createElement('p');
            noEntriesMsg.textContent = 'No entries are available.';
            pendingContainer.appendChild(noEntriesMsg);
            return;
        }
    
        tickets.forEach((ticket, index) => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            ticketDiv.setAttribute('data-priority', ticket.priority);
            ticketDiv.setAttribute('data-completed', ticket.completed);
            let reopenedInfo = ticket.reopened_count ? `<p>Reopened Count: ${ticket.reopened_count}</p>` : ''; 
            const ticketContentDiv = document.createElement('div');
            ticketContentDiv.className = 'ticket-content';
            ticketContentDiv.innerHTML = `
                <p>Submitted by: ${ticket.user_id}</p>
                <p>${ticket.content}</p>
                <p>${ticket.subject}</p>
                <p>${ticket.details}</p>
                <p>Priority: ${ticket.priority}</p>
                <p>Created: ${ticket.creation_time}</p>
                <p>Status: ${ticket.status}</p>`+ reopenedInfo +
                                   (ticket.completed && ticket.completion_time ? `<p>Completed: ${ticket.completion_time}</p>` : '');

                
    
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = ticket.completed;
                checkbox.onchange = () => updateTicketStatus(checkbox, ticket.content);
                ticketContentDiv.appendChild(checkbox);
                    
            // Section for comments
            const commentsSection = document.createElement('div');
            commentsSection.className = 'comments';
            ticket.comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.textContent = `${comment.admin_id}: ${comment.comment} (${comment.timestamp})`;
                commentsSection.appendChild(commentDiv);
            });
    
            // Input for new comments
            const newCommentInput = document.createElement('input');
            newCommentInput.type = 'text';
            newCommentInput.placeholder = 'Add a comment...';
            const submitCommentButton = document.createElement('button');
            submitCommentButton.textContent = 'Add Comment';
            submitCommentButton.onclick = () => addComment(ticket.content, newCommentInput.value);
    
            commentsSection.appendChild(newCommentInput);
            commentsSection.appendChild(submitCommentButton);
            ticketDiv.appendChild(ticketContentDiv)
    
            ticketDiv.appendChild(commentsSection);
    
            // Append the ticket to the correct container based on its status
            if (ticket.status === 'Reopened') {
                // Add reopened ticket to the reopened tickets container
                reopenedContainer.appendChild(ticketDiv);
            } else {
                // Append the ticket to the correct container based on its status
                ticket.status === 'Completed' ? completedContainer.appendChild(ticketDiv) : pendingContainer.appendChild(ticketDiv);
            }
        });
    }
    
    // Function to update ticket status
    
    

    // Function to add a comment
    function addComment(ticketNumber, commentText) {
        if (!adminUserId) {
            alert('Admin user ID not found.');
            return;
        }
        console.log("Adding comment to ticket number:", ticketNumber);
        fetch(`/add_comment/${ticketNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `comment=${encodeURIComponent(commentText)}&admin_id=${encodeURIComponent(adminUserId)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Comment added successfully");
                fetchTickets(isEmployeeDashboard);
            }
        });
    }
    
    // Update ticket status
    function updateTicketStatus(checkbox, ticketNumber) {
        console.log(`Updating status for ticket number: ${ticketNumber}, Completed: ${checkbox.checked}`);
        fetch(`/update_ticket/${ticketNumber}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`Ticket ${ticketNumber} status updated successfully.`);
                    fetchTickets(isEmployeeDashboard).then(() => updateTaskCounts());
                }
            });
    };
    // Function to delete a ticket
    window.deleteTicket = function(ticketNumber) {
        console.log("Deleting ticket number:", ticketNumber);
        fetch(`/delete_ticket/${ticketNumber}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`Ticket ${ticketNumber} deleted successfully.`);
                    fetchTickets(isEmployeeDashboard);
                }
            });
    };
    function reopenTicket(ticketNumber) {
        console.log("Reopening ticket number:", ticketNumber);
        fetch(`/reopen_ticket/${ticketNumber}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`Ticket ${ticketNumber} reopened successfully.`);
                    fetchTickets(isEmployeeDashboard);
                }
            });
    };
    
    function applyFilter() {
        const filterValue = document.getElementById('ticket_filter').value;
        fetchTickets(isEmployeeDashboard, filterValue);
    }

    // Update task counts
    function updateTaskCounts() {
        fetch('/get_tickets')
            .then(response => response.json())
            .then(data => {
                const tickets = data.tickets;
                const completedCount = tickets.filter(ticket => ticket.completed).length;
                const pendingCount = tickets.length - completedCount;
                document.getElementById('completed_count').textContent = completedCount;
                document.getElementById('pending_count').textContent = pendingCount;
            });
    }
});