$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host 'Site local: http://127.0.0.1:8000'
    Write-Host 'Para encerrar, pressione Ctrl+C.'
    & $python.Source -m http.server 8000 --bind 127.0.0.1
    exit $LASTEXITCODE
}

$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) {
    Write-Host 'Site local: http://127.0.0.1:8000'
    Write-Host 'Para encerrar, pressione Ctrl+C.'
    & $py.Source -3 -m http.server 8000 --bind 127.0.0.1
    exit $LASTEXITCODE
}

throw 'Python 3 nao foi encontrado. Instale o Python ou execute: python -m http.server 8000'
