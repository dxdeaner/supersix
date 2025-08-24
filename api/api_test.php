<?php
// api_test.php - Test all API endpoints
error_reporting(E_ALL);
ini_set('display_errors', 1);
?>
<!DOCTYPE html>
<html>
<head>
    <title>SuperSix API Test</title>
    <style>
        body { font-family: Arial, sans-serif; background: #1e293b; color: #e2e8f0; padding: 20px; }
        .test-section { background: #334155; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        pre { background: #0f172a; padding: 10px; border-radius: 3px; overflow-x: auto; }
        button { background: #0891b2; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin: 5px; cursor: pointer; }
        button:hover { background: #0e7490; }
    </style>
</head>
<body>
    <h1>🧪 SuperSix API Test Suite</h1>

    <div class="test-section">
        <h2>📋 Test Boards API</h2>
        <button onclick="testBoards()">Test GET /boards.php</button>
        <div id="boards-result"></div>
    </div>

    <div class="test-section">
        <h2>📝 Test Tasks API</h2>
        <button onclick="testTasks()">Test GET /tasks.php?board_id=1</button>
        <div id="tasks-result"></div>
    </div>

    <div class="test-section">
        <h2>➕ Test Create Task</h2>
        <button onclick="createTask()">Test POST /tasks.php (Create)</button>
        <div id="create-result"></div>
    </div>

    <div class="test-section">
        <h2>✅ Test Complete Task</h2>
        <button onclick="completeTask()">Test POST /tasks.php?action=complete</button>
        <div id="complete-result"></div>
    </div>

    <div class="test-section">
        <h2>🚀 Launch Frontend</h2>
        <p>If all tests above pass, your APIs are working!</p>
        <a href="../index.html" style="background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🎯 Open SuperSix App</a>
    </div>

    <script>
        async function testAPI(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
                
                return {
                    ok: response.ok,
                    status: response.status,
                    data: data
                };
            } catch (error) {
                return {
                    ok: false,
                    status: 'Network Error',
                    data: error.message
                };
            }
        }

        async function testBoards() {
            const result = await testAPI('./boards.php');
            const resultDiv = document.getElementById('boards-result');
            
            if (result.ok && Array.isArray(result.data)) {
                resultDiv.innerHTML = `
                    <p class="success">✅ Success! Found ${result.data.length} boards</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <p class="error">❌ Error (${result.status})</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            }
        }

        async function testTasks() {
            const result = await testAPI('./tasks.php?board_id=1');
            const resultDiv = document.getElementById('tasks-result');
            
            if (result.ok && Array.isArray(result.data)) {
                resultDiv.innerHTML = `
                    <p class="success">✅ Success! Found ${result.data.length} tasks</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <p class="error">❌ Error (${result.status})</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            }
        }

        async function createTask() {
            const result = await testAPI('./tasks.php', {
                method: 'POST',
                body: JSON.stringify({
                    board_id: 1,
                    title: 'API Test Task',
                    description: 'This task was created by the API test'
                })
            });
            
            const resultDiv = document.getElementById('create-result');
            
            if (result.ok) {
                resultDiv.innerHTML = `
                    <p class="success">✅ Success! Task created</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <p class="error">❌ Error (${result.status})</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            }
        }

        async function completeTask() {
            // First get a task to complete
            const tasksResult = await testAPI('./tasks.php?board_id=1');
            
            if (!tasksResult.ok || !Array.isArray(tasksResult.data) || tasksResult.data.length === 0) {
                document.getElementById('complete-result').innerHTML = `
                    <p class="error">❌ No tasks found to complete</p>
                `;
                return;
            }
            
            // Find an active task
            const activeTask = tasksResult.data.find(t => t.status === 'active');
            if (!activeTask) {
                document.getElementById('complete-result').innerHTML = `
                    <p class="error">❌ No active tasks found to complete</p>
                `;
                return;
            }
            
            const result = await testAPI('./tasks.php?action=complete', {
                method: 'POST',
                body: JSON.stringify({
                    id: activeTask.id
                })
            });
            
            const resultDiv = document.getElementById('complete-result');
            
            if (result.ok) {
                resultDiv.innerHTML = `
                    <p class="success">✅ Success! Task #${activeTask.id} completed</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            } else {
                resultDiv.innerHTML = `
                    <p class="error">❌ Error (${result.status})</p>
                    <pre>${JSON.stringify(result.data, null, 2)}</pre>
                `;
            }
        }
    </script>
</body>
</html>