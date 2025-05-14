@echo off
echo Setting up Code Enhancement MCP Server...

echo Installing dependencies...
pip install -r requirements.txt

echo Testing server...
start "Code Enhancement MCP Server" run_server.bat
timeout /t 5 /nobreak > nul
python test_server.py

echo Registering with Nexus Hub...
python register_with_nexus.py

echo Setup complete!
