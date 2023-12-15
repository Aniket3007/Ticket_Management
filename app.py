from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
from datetime import datetime
import hashlib
app = Flask(__name__)
admin_username  ={}
# Load users from Excel
df_employees = pd.read_excel('employees.xlsx')
df_admins = pd.read_excel('users.xlsx')
tickets = []
user_sessions = {}
priority_mapping = {'urgent': 3, 'high': 2, 'low': 1}

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
            return redirect(url_for('admin_dashboard',unique_id=unique_id)) # Redirect to a different page for admin
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
    return render_template('dashboard.html')  # Employee dashboard

@app.route('/admin_dashboard')
def admin_dashboard():
    unique_id = request.args.get('unique_id', 'Unknown')
    return render_template('admin_dashboard.html',unique_id =unique_id)
 

@app.route('/submit_ticket', methods=['POST'])
def submit_ticket():
    ticket_content = request.form['ticket_content']
    ticket1 = request.form['ticket_content1']
    priority = request.form['priority']
   
    print(ticket1)
    user_id1 = user_sessions.get('user_id', 'Unknown')
    creation_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(user_id1)
    tickets.append({"content": ticket_content,"comments": [],"details":ticket1,"priority": priority,"status": "Pending", "completed": False, "user_id": user_id1,"creation_time":creation_time,"completion_time":None})
    return redirect(url_for('dashboard'))

@app.route('/update_ticket/<int:ticket_id>', methods=['POST'])
def update_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        tickets[ticket_id]['completed'] = not tickets[ticket_id]['completed']
        if tickets[ticket_id]['completed']:
            tickets[ticket_id]['status'] = 'Completed'  # Update status to Completed
            tickets[ticket_id]['completion_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return ({"success": True})
    return ({"success": False})
@app.route('/get_tickets')
def get_tickets():
    sorted_tickets = sorted(tickets, key=lambda x: priority_mapping.get(x['priority'], 0), reverse=True)
    formatted_tickets = [{**ticket, 
                          "creation_time": str(ticket["creation_time"]), 
                          "completion_time": str(ticket["completion_time"]) if ticket["completion_time"] else None} 
                         for ticket in sorted_tickets]
    return {"tickets": formatted_tickets}
@app.route('/delete_ticket/<int:ticket_id>', methods=['DELETE'])
def delete_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        del tickets[ticket_id]
        return {"success": True}
    return {"success": False}
@app.route('/add_comment/<int:ticket_id>', methods=['POST'])
def add_comment(ticket_id):
    if 0 <= ticket_id < len(tickets):
        comment = request.form['comment']
        admin_id = request.form['admin_id']
        tickets[ticket_id]['comments'].append({"admin_id": admin_id, "comment": comment, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        
        if tickets[ticket_id].get('status') == 'Pending':  # Change status to In Progress on first comment
            tickets[ticket_id]['status'] = 'In Progress'

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


if __name__ == '__main__':
    app.run(debug=True)
