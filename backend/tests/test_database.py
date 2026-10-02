from app.database import Database


def test_creates_and_isolates_default_boards(tmp_path):
    database = Database(tmp_path / "kanban.db")
    first_user = database.get_or_create_user("first")
    second_user = database.get_or_create_user("second")

    first_board = database.get_board(first_user)
    second_board = database.get_board(second_user)
    first_board.columns[0].title = "Ideas"
    database.save_board(first_user, first_board)

    assert database.get_board(first_user).columns[0].title == "Ideas"
    assert database.get_board(second_user).columns[0].title == second_board.columns[0].title
