from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
from datetime import datetime
import hashlib
app = Flask(__name__)
admin_username  ={}
last_ticket_number = 0
# Load users from Excel
df_employees = pd.read_excel('employees.xlsx')
df_admins = pd.read_excel('users.xlsx')
tickets = []
user_sessions = {}
priority_mapping = {'urgent': 3, 'high': 2, 'low': 1}
ticket_subjects = ['IT Issue', 'HR Issue', 'General Inquiry', 'Facilities']

@app.route('/', methods=['GET', 'POST'])
def login():
    error_message = None
    if request.method == 'POST':
        role = request.form['role']
        user_id = request.form['userid']
        password = request.form['password']
        print("Attempting login with:", role, user_id, password)

        if role == 'employee' and authenticate_user(user_id, password, df_employees):
            print("Employee Authentication successful")
            user_sessions['user_id'] = user_id
            error_message ="login successfull"
            return redirect(url_for('dashboard'))
        elif role == 'admin' and authenticate_user(user_id, password, df_admins):
            print("Admin Authentication successful")
            unique_id = hashlib.md5(str(datetime.now()).encode()).hexdigest()
            admin_username[unique_id] = user_id
            error_message ="login successfull"
            return redirect(url_for('admin_dashboard',unique_id=unique_id)) 
        else:
            error_message = "Invalid Username and Password"


    return render_template('login.html',error_message =error_message)

def authenticate_user(user_id, password, df_users):
    user_id = str(user_id)
    a =user_id
    password = str(password)
    df_users['UserID'] = df_users['UserID'].astype(str)
    df_users['Password'] = df_users['Password'].astype(str)
    return any((df_users['UserID'] == user_id) & (df_users['Password'] == password))

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')  

@app.route('/admin_dashboard')
def admin_dashboard():
    unique_id = request.args.get('unique_id', 'Unknown')
    return render_template('admin_dashboard.html',unique_id =unique_id)
 

@app.route('/submit_ticket', methods=['POST'])
def submit_ticket():
    
    ticket1 = request.form['ticket_content1']
    priority = request.form['priority']
    global last_ticket_number
    ticket_subject = request.form['ticket_subject']
    last_ticket_number += 1
    ticket_number = f"{last_ticket_number:04d}" 
   
    print(ticket1)
    user_id1 = user_sessions.get('user_id', 'Unknown')
    creation_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(user_id1)
    tickets.append({"content": ticket_number,"subject":ticket_subject,"comments": [],"details":ticket1,"priority": priority,"status": "Pending", "completed": False, "user_id": user_id1,"creation_time":creation_time,"completion_time":None})
    return redirect(url_for('dashboard'))

@app.route('/update_ticket/<int:ticket_id>', methods=['POST'])
def update_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        tickets[ticket_id]['completed'] = not tickets[ticket_id]['completed']
        if tickets[ticket_id]['completed']:
            tickets[ticket_id]['status'] = 'Completed' 
            tickets[ticket_id]['completion_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return ({"success": True})
    return ({"success": False})


# ...

@app.route('/get_tickets')
def get_tickets():
    filter_type = request.args.get('filter', 'all').lower()
    search_query = request.args.get('search', '').lower()
    sorted_tickets = sorted(tickets, key=lambda x: priority_mapping.get(x['priority'], 0), reverse=True)

    # Filter based on the filter type
    if filter_type != 'all':
        if filter_type in ['pending', 'completed', 'reopened', 'deleted']:
            sorted_tickets = [ticket for ticket in sorted_tickets if ticket['status'].lower() == filter_type]
        else:
            sorted_tickets = [ticket for ticket in sorted_tickets if ticket['priority'] == filter_type]

    # Further filter based on the search query
    if search_query:
        sorted_tickets = [ticket for ticket in sorted_tickets if search_query in ticket['details'].lower()]

    formatted_tickets = [{**ticket, 
                          "creation_time": str(ticket["creation_time"]), 
                          "completion_time": str(ticket["completion_time"]) if ticket["completion_time"] else None} 
                         for ticket in sorted_tickets]
    return {"tickets": formatted_tickets}


@app.route('/delete_ticket/<int:ticket_id>', methods=['DELETE'])
def delete_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        tickets[ticket_id]['status'] = 'Deleted'
        return {"success": True}
    return {"success": False}

@app.route('/add_comment/<ticket_number>', methods=['POST'])
def add_comment(ticket_number):
    # Find the ticket by its unique ticket_number
    ticket = next((ticket for ticket in tickets if ticket['content'] == ticket_number), None)
    if ticket:
        comment = request.form['comment']
        admin_id = request.form['admin_id']
        ticket['comments'].append({"admin_id": admin_id, "comment": comment, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        
        if ticket.get('status') == 'Pending':  
            ticket['status'] = 'In Progress'
        return {"success": True}
    return {"success": False}

@app.route('/get_comments/<int:ticket_id>', methods=['GET'])
def get_comments(ticket_id):
    if 0 <= ticket_id < len(tickets):
        return {"comments": tickets[ticket_id]['comments']}
    return {"comments": []}
@app.route('/get_admin_id/<unique_id>')
def get_admin_id(unique_id):
    admin_id = admin_username.get(unique_id, 'Unknown')
    return {"admin_id": admin_id}
@app.route('/reopen_ticket/<int:ticket_id>', methods=['POST'])
def reopen_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        ticket = tickets[ticket_id]
        ticket['status'] = 'Reopened'
        ticket['reopened_count'] = ticket.get('reopened_count', 0) + 1
        ticket['completed'] = False
        return {"success": True}
    return {"success": False}

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')