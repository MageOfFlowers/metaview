import { getLastRequestError, request } from './api.js';

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const state = { users: [], decks: [], competitions: [], teams: [], members: [], matches: [], duels: [] };
let rosterPlayerSearchId = 0;

function competitionType(competition) {
    return (competition.tournamentType || 'SINGLE').toUpperCase();
}

function fillSelect(select, rows, valueOf, labelOf, placeholder) {
    const selectedValue = select.value;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + rows.map((row) =>
        `<option value="${Number(valueOf(row))}">${escapeHtml(labelOf(row))}</option>`
    ).join('');
    if (rows.some((row) => String(valueOf(row)) === selectedValue)) select.value = selectedValue;
}

function fillSearchableDeck(select, search, rows, placeholder) {
    const selectedValue = select.value;
    const term = search.value.trim().toLocaleLowerCase();
    const filtered = rows.filter((row) => String(row.name ?? '').toLocaleLowerCase().includes(term));
    fillSelect(select, filtered, (row) => row.id, (row) => row.name, placeholder);
    if (filtered.some((row) => String(row.id) === selectedValue)) {
        select.value = selectedValue;
    } else if (selectedValue) {
        select.value = '';
    }
}

async function loadSourceData() {
    const [users, decks, competitions] = await Promise.all([
        request('/users'), request('/decksget'), request('/competitions')
    ]);
    if (!users || !decks || !competitions) {
        byId('teamfightStatus').textContent = 'Không tải được dữ liệu quản lý. Kiểm tra API và chạy config/teamfight.sql.';
        return false;
    }
    state.users = users;
    state.decks = decks;
    state.competitions = competitions;
    if (window.cacheData) {
        Object.assign(window.cacheData, { users, decks, comps: competitions });
    }
    renderRosterRows();
    refreshCompetitionOptions();
    return true;
}

function refreshCompetitionOptions() {
    const mode = byId('managerMode').value;
    const teamfightCompetitions = state.competitions.filter((competition) => competitionType(competition) === 'TEAMFIGHT');
    fillSelect(
        byId('teamfightCompetition'), teamfightCompetitions,
        (competition) => competition.id, (competition) => competition.name, 'Chọn giải Teamfight'
    );
    const singleSection = byId('single-tournament-manager');
    const teamfightSection = byId('teamfight-manager');
    singleSection.style.display = mode === 'SINGLE' ? '' : 'none';
    teamfightSection.style.display = mode === 'TEAMFIGHT' ? 'block' : 'none';
    byId('managerModeHint').textContent = mode === 'TEAMFIGHT'
        ? 'Mỗi đội có 3-4 thành viên. Khi ghi kết quả, có thể chọn bất kỳ người chơi và bộ bài nào trong danh sách.'
        : 'Quản lý kết quả thi đấu cá nhân.';
    if (mode === 'TEAMFIGHT' && !teamfightCompetitions.some((item) => String(item.id) === byId('teamfightCompetition').value)) {
        byId('teamfightCompetition').value = '';
        clearTeamfightData();
    }
}

function clearTeamfightData() {
    state.teams = [];
    state.members = [];
    state.matches = [];
    state.duels = [];
    if (window.cacheData) window.cacheData.teamfightMembers = [];
    renderTeams();
    renderMatches();
    renderBracket();
    fillSelect(byId('teamfightTeam1'), [], (item) => item.id, (item) => item.name, 'Chọn đội 1');
    fillSelect(byId('teamfightTeam2'), [], (item) => item.id, (item) => item.name, 'Chọn đội 2');
    fillSelect(byId('teamfightTieBreak'), [], (item) => item.id, (item) => item.name, 'Không có đội thắng tie-break');
    renderDuelRows();
}

async function loadTeamfightData() {
    const competitionId = byId('teamfightCompetition').value;
    if (!competitionId) {
        clearTeamfightData();
        return;
    }
    const query = `?competitionId=${encodeURIComponent(competitionId)}`;
    const [teams, members, matches, duels] = await Promise.all([
        request(`/teamfight/teams${query}`),
        request(`/teamfight/members${query}`),
        request(`/teamfight/matches${query}`),
        request(`/teamfight/duels${query}`)
    ]);
    if (!teams || !members || !matches || !duels) {
        byId('teamfightStatus').textContent = 'Không tải được dữ liệu Teamfight. Hãy xác nhận đã chạy SQL và triển khai lại backend.';
        return;
    }
    byId('teamfightStatus').textContent = '';
    Object.assign(state, { teams, members, matches, duels });
    if (window.cacheData) window.cacheData.teamfightMembers = members;
    fillSelect(byId('teamfightTeam1'), teams, (team) => team.id, (team) => team.name, 'Chọn đội 1');
    fillSelect(byId('teamfightTeam2'), teams, (team) => team.id, (team) => team.name, 'Chọn đội 2');
    fillSelect(byId('teamfightTieBreak'), teams, (team) => team.id, (team) => team.name, 'Không có đội thắng tie-break');
    renderTeams();
    renderMatches();
    renderBracket();
    renderDuelRows();
}

function renderRosterRows() {
    const container = byId('teamfightRoster');
    const rows = container.querySelectorAll('.teamfight-roster-row');
    const memberCount = rows.length;
    byId('addRosterMember').disabled = memberCount >= 4;
    const users = state.users;
    const decks = state.decks;
    rows.forEach((row) => {
        fillSearchableDeck(row.querySelector('.roster-deck'), row.querySelector('.roster-deck-search'),
            decks.map((deck) => ({ id: deck.id, name: deck.name })), 'Chọn bộ bài');
        row.querySelector('.remove-roster-member').disabled = memberCount <= 3;
    });
}

function addRosterRow() {
    const row = document.createElement('div');
    row.className = 'teamfight-roster-row teamfight-row';
    const playerSelectId = `teamfightUser-${++rosterPlayerSearchId}`;
    row.innerHTML = `
        <div><label>Tìm người chơi</label><input class="roster-user-search" type="search" placeholder="Tìm người chơi..."
        oninput="window.filterSelect('${playerSelectId}', this.value)">
        <select class="roster-user select-dropdown" id="${playerSelectId}" size="4"></select></div>
        <div><label>Tìm bộ bài thành viên</label><input class="roster-deck-search" type="search" placeholder="Tìm bộ bài...">
        <select class="roster-deck"></select></div>
        <button type="button" class="remove-roster-member btn-sm" style="background:#dc3545">Xóa</button>`;
    row.querySelector('.roster-user').onchange = (event) => {
        const select = event.currentTarget;
        if (select.selectedIndex >= 0) {
            row.querySelector('.roster-user-search').value = select.options[select.selectedIndex].text;
        }
        select.classList.remove('show');
    };
    row.querySelector('.roster-deck-search').oninput = () => renderRosterRows();
    row.querySelector('.remove-roster-member').onclick = () => {
        if (byId('teamfightRoster').querySelectorAll('.teamfight-roster-row').length > 3) {
            row.remove();
            renderRosterRows();
        }
    };
    byId('teamfightRoster').appendChild(row);
    renderRosterRows();
}

function teamMembers(teamId) {
    return state.members.filter((member) => String(member.teamId) === String(teamId));
}

function teamOptions(teamId, type) {
    const members = teamMembers(teamId);
    if (type === 'player') {
        return members.map((member) => {
            const user = state.users.find((item) => String(item.id) === String(member.userId));
            return { id: member.userId, name: user?.username || user?.name || `Player ${member.userId}` };
        });
    }
    return members.map((member) => {
        const deck = state.decks.find((item) => String(item.id) === String(member.deckId));
        const user = state.users.find((item) => String(item.id) === String(member.userId));
        return {
            id: member.deckId,
            name: `${deck?.name || `Deck ${member.deckId}`} (${user?.username || user?.name || 'member'})`
        };
    });
}

function renderDuelRows() {
    const team1Id = byId('teamfightTeam1').value;
    const team2Id = byId('teamfightTeam2').value;
    const tieBreakTeams = state.teams.filter((team) =>
        String(team.id) === team1Id || String(team.id) === team2Id
    );
    fillSelect(byId('teamfightTieBreak'), tieBreakTeams,
        (team) => team.id, (team) => team.name, 'Không có đội thắng tie-break');
    const duelsContainer = byId('teamfightDuels');
    const rows = duelsContainer.querySelectorAll('.teamfight-duel-row');
    rows.forEach((row) => {
        const player1Select = row.querySelector('.duel-player1');
        const player2Select = row.querySelector('.duel-player2');
        player1Select.dataset.teamId = team1Id;
        player2Select.dataset.teamId = team2Id;
        fillSelect(player1Select, teamOptions(team1Id, 'player'),
            (user) => user.id, (user) => user.name, 'Người chơi đội 1');
        fillSearchableDeck(row.querySelector('.duel-deck1'), row.querySelector('.duel-deck1-search'),
            teamOptions(team1Id, 'deck'), 'Bộ bài đội 1');
        fillSelect(player2Select, teamOptions(team2Id, 'player'),
            (user) => user.id, (user) => user.name, 'Người chơi đội 2');
        fillSearchableDeck(row.querySelector('.duel-deck2'), row.querySelector('.duel-deck2-search'),
            teamOptions(team2Id, 'deck'), 'Bộ bài đội 2');
        const search1 = row.querySelector('.duel-player1-search').value;
        const search2 = row.querySelector('.duel-player2-search').value;
        if (search1) window.filterSelect(player1Select.id, search1);
        if (search2) window.filterSelect(player2Select.id, search2);
    });
}

function addDuelRow() {
    const row = document.createElement('div');
    row.className = 'teamfight-duel-row teamfight-row';
    const player1SelectId = `teamfightDuelUser-${++rosterPlayerSearchId}`;
    const player2SelectId = `teamfightDuelUser-${++rosterPlayerSearchId}`;
    row.innerHTML = `
        <div class="teamfight-player-picker"><label>Tìm người chơi đội 1</label><input class="duel-player1-search" type="search" placeholder="Tìm người chơi trong đội 1..."
        oninput="window.filterSelect('${player1SelectId}', this.value)">
        <select class="duel-player1" id="${player1SelectId}"></select></div>
        <div><label>Tìm bộ bài đội 1</label><input class="duel-deck1-search" type="search" placeholder="Tìm bộ bài trong đội 1...">
        <select class="duel-deck1"></select></div>
        <div class="teamfight-player-picker"><label>Tìm người chơi đội 2</label><input class="duel-player2-search" type="search" placeholder="Tìm người chơi trong đội 2..."
        oninput="window.filterSelect('${player2SelectId}', this.value)">
        <select class="duel-player2" id="${player2SelectId}"></select></div>
        <div><label>Tìm bộ bài đội 2</label><input class="duel-deck2-search" type="search" placeholder="Tìm bộ bài trong đội 2...">
        <select class="duel-deck2"></select></div>
        <div><label>Kết quả cặp đấu</label><select class="duel-winner">
            <option value="TEAM1">Đội 1 thắng</option><option value="TEAM2">Đội 2 thắng</option><option value="DRAW">Hòa</option>
        </select></div>
        <button type="button" class="remove-duel btn-sm" style="background:#dc3545">Xóa</button>`;
    row.querySelector('.remove-duel').onclick = () => row.remove();
    row.querySelector('.duel-player1').onchange = (event) => {
        const select = event.currentTarget;
        if (select.selectedIndex >= 0) {
            row.querySelector('.duel-player1-search').value = select.options[select.selectedIndex].text;
        }
        select.classList.remove('show');
    };
    row.querySelector('.duel-player2').onchange = (event) => {
        const select = event.currentTarget;
        if (select.selectedIndex >= 0) {
            row.querySelector('.duel-player2-search').value = select.options[select.selectedIndex].text;
        }
        select.classList.remove('show');
    };
    row.querySelector('.duel-deck1-search').oninput = () => renderDuelRows();
    row.querySelector('.duel-deck2-search').oninput = () => renderDuelRows();
    byId('teamfightDuels').appendChild(row);
    renderDuelRows();
}

function renderTeams() {
    const teams = byId('teamfightTeamList');
    if (!state.teams.length) {
        teams.textContent = 'Chưa có đội nào.';
        return;
    }
    teams.innerHTML = state.teams.map((team) => {
        const roster = teamMembers(team.id).map((member) => {
            const user = state.users.find((item) => item.id === member.userId);
            const deck = state.decks.find((item) => item.id === member.deckId);
            return `${escapeHtml(user?.username || user?.name || `Player ${member.userId}`)} — ${escapeHtml(deck?.name || `Deck ${member.deckId}`)}`;
        }).join(', ');
        return `<div class="teamfight-match">
            <strong>${escapeHtml(team.name)}</strong><div>${roster}</div>
            <button type="button" class="btn-sm edit-teamfight-team" data-id="${Number(team.id)}" style="background:#2563eb">Chỉnh sửa</button>
        </div>`;
    }).join('');
    teams.querySelectorAll('.edit-teamfight-team').forEach((button) => {
        button.onclick = () => editTeam(Number(button.dataset.id));
    });
}

function editTeam(teamId) {
    const team = state.teams.find((item) => item.id === teamId);
    if (!team) return;
    const members = teamMembers(teamId);
    byId('teamfightEditingTeamId').value = String(team.id);
    byId('teamfightTeamName').value = team.name;
    byId('teamfightRoster').innerHTML = '';
    members.forEach((member) => {
        addRosterRow();
        const row = byId('teamfightRoster').lastElementChild;
        const user = state.users.find((item) => item.id === member.userId);
        const userSearch = row.querySelector('.roster-user-search');
        const userSelect = row.querySelector('.roster-user');
        userSearch.value = user?.username || user?.name || '';
        window.filterSelect(userSelect.id, userSearch.value);
        userSelect.value = String(member.userId);
        row.querySelector('.roster-deck').value = String(member.deckId);
    });
    renderRosterRows();
    byId('saveTeamfightTeam').textContent = 'Lưu thay đổi';
    byId('cancelTeamfightTeamEdit').style.display = '';
    byId('teamfightTeamName').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetTeamEditor() {
    byId('teamfightEditingTeamId').value = '';
    byId('teamfightTeamName').value = '';
    byId('teamfightRoster').innerHTML = '';
    for (let i = 0; i < 3; i++) addRosterRow();
    byId('saveTeamfightTeam').textContent = 'Lưu đội';
    byId('cancelTeamfightTeamEdit').style.display = 'none';
}

function renderMatches() {
    const container = byId('teamfightMatchList');
    if (!state.matches.length) {
        container.textContent = 'Chưa có trận đấu nào.';
        return;
    }
    container.innerHTML = state.matches.map((match) => {
        const team1 = state.teams.find((team) => team.id === match.team1Id);
        const team2 = state.teams.find((team) => team.id === match.team2Id);
        const winner = state.teams.find((team) => team.id === match.winnerTeamId);
        const duels = state.duels.filter((duel) => duel.matchId === match.id);
        const scores = [0, 0];
        duels.forEach((duel) => {
            if (duel.winnerSide === 'TEAM1') scores[0]++;
            if (duel.winnerSide === 'TEAM2') scores[1]++;
        });
        return `<div class="teamfight-match">
            <strong>Vòng ${match.roundNumber}: ${escapeHtml(team1?.name || 'Đội 1')} ${scores[0]} - ${scores[1]} ${escapeHtml(team2?.name || 'Đội 2')}</strong>
            <span> — ${winner ? `${escapeHtml(winner.name)} thắng` : 'Hòa'}</span>
            <button type="button" class="btn-sm delete-teamfight-match" data-id="${Number(match.id)}" style="background:#dc3545">Xóa</button>
            <div>${duels.map((duel) => {
                const p1 = state.users.find((user) => user.id === duel.player1Id);
                const p2 = state.users.find((user) => user.id === duel.player2Id);
                const d1 = state.decks.find((deck) => deck.id === duel.deck1Id);
                const d2 = state.decks.find((deck) => deck.id === duel.deck2Id);
                const result = duel.winnerSide === 'TEAM1' ? 'Đội 1 thắng'
                    : duel.winnerSide === 'TEAM2' ? 'Đội 2 thắng' : 'Hòa';
                return `${escapeHtml(p1?.username || p1?.name || 'Người chơi')} (${escapeHtml(d1?.name || 'Bộ bài')}) vs ${escapeHtml(p2?.username || p2?.name || 'Người chơi')} (${escapeHtml(d2?.name || 'Bộ bài')}): ${result}`;
            }).join('<br>')}</div>
        </div>`;
    }).join('');
    container.querySelectorAll('.delete-teamfight-match').forEach((button) => {
        button.onclick = async () => {
            if (!confirm('Xóa trận này và toàn bộ các cặp đấu?')) return;
            const result = await request('/teamfight/match-delete', 'POST', Number(button.dataset.id));
            if (result === null) return alert('Không xóa được trận đấu.');
            await loadTeamfightData();
        };
    });
}

function renderBracket() {
    const container = byId('teamfightBracket');
    const heading = byId('teamfightBracketHeading');
    const competition = state.competitions.find(
        (item) => String(item.id) === byId('teamfightCompetition').value
    );
    const isElimination = competition?.tournamentFormat === 'SINGLE_ELIMINATION';
    container.style.display = isElimination ? '' : 'none';
    heading.style.display = isElimination ? '' : 'none';
    if (!isElimination) {
        container.innerHTML = '';
        return;
    }

    const rounds = new Map();
    state.matches.forEach((match) => {
        const round = Number(match.roundNumber);
        if (!rounds.has(round)) rounds.set(round, []);
        rounds.get(round).push(match);
    });
    const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);
    if (!roundNumbers.length) {
        container.innerHTML = '<p>Chưa có trận đấu. Hãy tạo trận ở phần ghi kết quả để bắt đầu nhánh.</p>';
        return;
    }
    const finalRound = Math.max(...roundNumbers);
    const roundName = (round) => {
        if (round === finalRound && round > 1) return 'Chung kết';
        if (round === finalRound - 1 && finalRound > 2) return 'Bán kết';
        return `Vòng ${round}`;
    };
    container.innerHTML = roundNumbers.map((round) => {
        const matches = rounds.get(round).sort((a, b) => a.id - b.id);
        return `<section class="teamfight-bracket-round">
            <h4>${roundName(round)}</h4>
            ${matches.map((match) => {
                const team1 = state.teams.find((team) => team.id === match.team1Id);
                const team2 = state.teams.find((team) => team.id === match.team2Id);
                const winner1 = match.winnerTeamId === match.team1Id;
                const winner2 = match.winnerTeamId === match.team2Id;
                const duels = state.duels.filter((duel) => duel.matchId === match.id);
                const score1 = duels.filter((duel) => duel.winnerSide === 'TEAM1').length;
                const score2 = duels.filter((duel) => duel.winnerSide === 'TEAM2').length;
                return `<div class="teamfight-bracket-match" data-match-id="${Number(match.id)}">
                    <button class="${winner1 ? 'winner' : ''}" type="button">${escapeHtml(team1?.name || 'Chưa xác định')} ${score1}</button>
                    <button class="${winner2 ? 'winner' : ''}" type="button">${escapeHtml(team2?.name || 'Chưa xác định')} ${score2}</button>
                    <small>${match.winnerTeamId == null ? 'Chưa có kết quả' : `Thắng: ${escapeHtml(state.teams.find((team) => team.id === match.winnerTeamId)?.name || '')}`}</small>
                </div>`;
            }).join('')}
        </section>`;
    }).join('');
}

async function createTournament() {
    const name = byId('newCompetitionName').value.trim();
    if (!name) return alert('Hãy nhập tên giải đấu.');
    const mode = byId('managerMode').value;
    const result = await request('/competitions', 'POST', {
        name,
        date: byId('newCompetitionDate').value || null,
        region: byId('newCompetitionRegion').value,
        tournamentType: mode,
        tournamentFormat: byId('newCompetitionFormat').value
    });
    if (!result) {
        byId('competitionCreateStatus').textContent = 'Không tạo được giải đấu. Hãy chạy SQL migration và triển khai lại backend.';
        return;
    }
    byId('competitionCreateStatus').textContent = 'Đã tạo giải đấu.';
    byId('newCompetitionName').value = '';
    await loadSourceData();
    if (mode === 'TEAMFIGHT') {
        byId('teamfightCompetition').value = String(result.id);
        await loadTeamfightData();
    } else if (window.filterSelect) {
        window.filterSelect('regComp', result.name);
    }
}

async function saveTeam() {
    const competitionId = Number(byId('teamfightCompetition').value);
    const members = Array.from(byId('teamfightRoster').querySelectorAll('.teamfight-roster-row')).map((row) => ({
        userId: Number(row.querySelector('.roster-user').value),
        deckId: Number(row.querySelector('.roster-deck').value)
    }));
    if (!competitionId || !byId('teamfightTeamName').value.trim() ||
            members.length < 3 || members.length > 4 || members.some((member) => !member.userId || !member.deckId)) {
        return alert('Chọn giải đấu, nhập tên đội và điền đủ cặp người chơi/bộ bài (3-4 thành viên).');
    }
    const result = await request('/teamfight/teams', 'POST', {
        id: byId('teamfightEditingTeamId').value ? Number(byId('teamfightEditingTeamId').value) : null,
        competitionId,
        name: byId('teamfightTeamName').value.trim(),
        members
    });
    if (!result) return alert('Không lưu được đội. Kiểm tra người chơi/bộ bài trùng và trạng thái SQL migration.');
    resetTeamEditor();
    await loadTeamfightData();
}

async function saveMatch() {
    const competitionId = Number(byId('teamfightCompetition').value);
    const roundNumber = Number(byId('teamfightRound').value);
    const rows = Array.from(byId('teamfightDuels').querySelectorAll('.teamfight-duel-row'));
    const duels = rows.map((row) => ({
        player1Id: Number(row.querySelector('.duel-player1').value),
        deck1Id: Number(row.querySelector('.duel-deck1').value),
        player2Id: Number(row.querySelector('.duel-player2').value),
        deck2Id: Number(row.querySelector('.duel-deck2').value),
        winnerSide: row.querySelector('.duel-winner').value
    }));
    if (!competitionId || !Number.isInteger(roundNumber) || roundNumber < 1 ||
            !byId('teamfightTeam1').value || !byId('teamfightTeam2').value ||
            byId('teamfightTeam1').value === byId('teamfightTeam2').value ||
            !duels.length || duels.some((duel) => !duel.player1Id || !duel.deck1Id || !duel.player2Id || !duel.deck2Id)) {
        return alert('Chọn hai đội khác nhau và nhập ít nhất một cặp đấu với người chơi/bộ bài hợp lệ.');
    }
    const result = await request('/teamfight/matches', 'POST', {
        competitionId,
        roundNumber,
        team1Id: Number(byId('teamfightTeam1').value),
        team2Id: Number(byId('teamfightTeam2').value),
        tieBreakWinnerTeamId: byId('teamfightTieBreak').value ? Number(byId('teamfightTieBreak').value) : null,
        duels
    });
    if (!result) {
        const error = getLastRequestError();
        alert(`Không lưu được trận.${error ? ` Chi tiết: ${error}` : ' Hãy kiểm tra kết nối hoặc triển khai backend mới nhất.'}`);
        return;
    }
    byId('teamfightDuels').innerHTML = '';
    addDuelRow();
    await loadTeamfightData();
}

byId('managerMode').onchange = refreshCompetitionOptions;
byId('createCompetitionBtn').onclick = createTournament;
byId('teamfightCompetition').onchange = () => {
    resetTeamEditor();
    loadTeamfightData();
};
byId('addRosterMember').onclick = () => {
    if (byId('teamfightRoster').querySelectorAll('.teamfight-roster-row').length < 4) addRosterRow();
};
byId('saveTeamfightTeam').onclick = saveTeam;
byId('cancelTeamfightTeamEdit').onclick = resetTeamEditor;
byId('teamfightTeam1').onchange = renderDuelRows;
byId('teamfightTeam2').onchange = renderDuelRows;
byId('addTeamfightDuel').onclick = addDuelRow;
byId('saveTeamfightMatch').onclick = saveMatch;

for (let i = 0; i < 3; i++) addRosterRow();
addDuelRow();
loadSourceData();
