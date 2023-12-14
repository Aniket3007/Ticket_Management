from flask import Flask, render_template, request, redirect, url_for
import pandas as pd

app = Flask(__name__)

# Load users from Excel
df_employees = pd.read_excel('employees.xlsx')
df_admins = pd.read_excel('users.xlsx')
tickets = []
user_sessions = {}

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form['role']
        user_id = request.form['userid']
        password = request.form['password']
        print("Attempting login with:", role, user_id, password)

        if role == 'employee' and authenticate_user(user_id, password, df_employees):
            print("Employee Authentication successful")
            user_sessions['user_id'] = user_id
            
            return redirect(url_for('dashboard'))
        elif role == 'admin' and authenticate_user(user_id, password, df_admins):
            print("Admin Authentication successful")
            return redirect(url_for('admin_dashboard'))  # Redirect to a different page for admin
        else:
            print("Authentication failed")
    return render_template('login.html')

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
    return render_template('admin_dashboard.html') 

@app.route('/submit_ticket', methods=['POST'])
def submit_ticket():
    ticket_content = request.form['ticket_content']
    user_id1 = user_sessions.get('user_id', 'Unknown')
    print(user_id1)
    tickets.append({"content": ticket_content, "completed": False, "user_id": user_id1})
    return redirect(url_for('dashboard'))

@app.route('/update_ticket/<int:ticket_id>', methods=['POST'])
def update_ticket(ticket_id):
    if 0 <= ticket_id < len(tickets):
        tickets[ticket_id]['completed'] = not tickets[ticket_id]['completed']
        return ({"success": True})
    return ({"success": False})

@app.route('/get_tickets')
def get_tickets():
    return ({"tickets": tickets})


if __name__ == '__main__':
    app.run(debug=True)
