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
    function fetchTickets(isEmployee) {
        fetch('/get_tickets')
            .then(response => response.json())
            .then(data => {
                isEmployee ? displayEmployeeTickets(data.tickets) : displayAdminTickets(data.tickets);
                if (!isEmployee) {
                    updateTaskCounts(data.tickets);
                }
            });
    
            
    }

    // Display tickets for employees
    function displayEmployeeTickets(tickets) {
        const container = document.getElementById('tickets_container');
        container.innerHTML = '';
        tickets.forEach((ticket, index) => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            const ticketContentDiv = document.createElement('div');
            ticketContentDiv.className = 'ticket-content'; 
            ticketContentDiv.innerHTML = `<p>Submitted by: ${ticket.user_id}</p>
                                   <p>${ticket.content}</p>
                                   <p>${ticket.subject}</p>
                                   <p>${ticket.details}</p>
                                   <p>Priority: ${ticket.priority}</p>
                                   <p>Created: ${ticket.creation_time}</p>
                                   <p>Status: ${ticket.status}</p>
                                   ${ticket.completed && ticket.completion_time ? `<p>Completed: ${ticket.completion_time}</p>` : ''}`;

            // Display comments from admins
            const commentsDiv = document.createElement('div');
            commentsDiv.className = 'comments';
            
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
            deleteButton.onclick = () => deleteTicket(index);
            ticketContentDiv.appendChild(deleteButton);

        container.appendChild(ticketDiv);
        });
    }

    // Display tickets for admins
    function displayAdminTickets(tickets) {
        const pendingContainer = document.getElementById('pending_tickets_container');
        const completedContainer = document.getElementById('completed_tickets_container');
        pendingContainer.innerHTML = '';
        completedContainer.innerHTML = '';
    
        tickets.forEach((ticket, index) => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            const ticketContentDiv = document.createElement('div');
            ticketContentDiv.className = 'ticket-content';
            ticketContentDiv.innerHTML = `
                <p>Submitted by: ${ticket.user_id}</p>
                <p>${ticket.content}</p>
                <p>${ticket.subject}</p>
                <p>${ticket.details}</p>
                <p>Priority: ${ticket.priority}</p>
                <p>Created: ${ticket.creation_time}</p>
                <p>Status: ${ticket.status}</p>
                ${ticket.completed ? `<p>Completed: ${ticket.completion_time}</p>` : ''}`;
                
    
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = ticket.completed;
                checkbox.onchange = () => updateTicketStatus(checkbox, ticket, index);
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
            submitCommentButton.onclick = () => addComment(index, newCommentInput.value);
    
            commentsSection.appendChild(newCommentInput);
            commentsSection.appendChild(submitCommentButton);
            ticketDiv.appendChild(ticketContentDiv)
    
            ticketDiv.appendChild(commentsSection);
    
            // Append the ticket to the correct container based on its status
            ticket.status === 'Completed' ? completedContainer.appendChild(ticketDiv) : pendingContainer.appendChild(ticketDiv);
        });
    }
    
    // Function to update ticket status
    
    

    // Function to add a comment
    function addComment(ticketIndex, commentText) {
        if (!adminUserId) {
            alert('Admin user ID not found.');
            return;
        }
        fetch(`/add_comment/${ticketIndex}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `comment=${encodeURIComponent(commentText)}&admin_id=${encodeURIComponent(adminUserId)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchTickets(false);
            }
        });
    }
    // Update ticket status
    function updateTicketStatus(checkbox, ticket, ticketIndex) {
        fetch(`/update_ticket/${ticketIndex}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    ticket.completed = checkbox.checked;
                    ticket.status = checkbox.checked ? 'Completed' : 'In Progress';
                    fetchTickets(false).then(() => updateTaskCounts());
                }
            });
    }
    // Function to delete a ticket
    window.deleteTicket = function(ticketIndex) {
        fetch(`/delete_ticket/${ticketIndex}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchTickets(true);
                }
            });
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
