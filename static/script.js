document.addEventListener("DOMContentLoaded", function() {
    const isEmployeeDashboard = document.getElementById('tickets_container') !== null;
    fetchTickets(isEmployeeDashboard);

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

    function displayEmployeeTickets(tickets) {
        const container = document.getElementById('tickets_container');
        container.innerHTML = '';
        tickets.forEach(ticket => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            ticketDiv.innerHTML = ` <p>Submitted by: ${ticket.user_id}</p><p>${ticket.content}</p><p>Status: ${ticket.completed ? 'Completed' : 'Pending'}</p>`;
            container.appendChild(ticketDiv);
        });
    }

    function displayAdminTickets(tickets) {
        const pendingContainer = document.getElementById('pending_tickets_container');
        const completedContainer = document.getElementById('completed_tickets_container');
        pendingContainer.innerHTML = '';
        completedContainer.innerHTML = '';

        tickets.forEach((ticket, index) => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket';
            ticketDiv.innerHTML = `<p>Submitted by: ${ticket.user_id}
                <p>${ticket.content}</p>
                <input type="checkbox" ${ticket.completed ? 'checked' : ''} 
                       onchange="updateTicketStatus(this, ${index})">
            `;

            ticket.completed ? completedContainer.appendChild(ticketDiv) : pendingContainer.appendChild(ticketDiv);
        });
    }

    function updateTaskCounts(tickets) {
        const completedCount = tickets.filter(ticket => ticket.completed).length;
        const pendingCount = tickets.length - completedCount;

        document.getElementById('completed_count').textContent = completedCount;
        document.getElementById('pending_count').textContent = pendingCount;
    }
});

function updateTicketStatus(checkbox, ticketIndex) {
    fetch(`/update_ticket/${ticketIndex}`, {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Move the ticket to the correct container
                const ticketDiv = checkbox.closest('.ticket');
                if (checkbox.checked) {
                    document.getElementById('completed_tickets_container').appendChild(ticketDiv);
                } else {
                    document.getElementById('pending_tickets_container').appendChild(ticketDiv);
                }
                // Fetch the updated list of tickets to refresh the task counts
                fetchTickets(false);
            }
        });
}
