import random

class Marble:
    """
    Emulates a Marble enum
    """
    RED = 'R'
    BLACK = 'B'
    WHITE = 'W'
    EMPTY = 'X'


class Direction:
    """
    Emulates a Direction enum
    """
    LEFT = 'L'
    RIGHT = 'R'
    FORWARD = 'F'
    BACKWARD = 'B'


class InvalidMove(Exception):
    """
    Custom error
    Thrown when a invalid move is tried
    """
    pass


class GameUtil:
    """
    Utility class to provide methods that
    does not need to be in KubaGame
    """
    vector_table = {
        Direction.LEFT: (0, -1),
        Direction.RIGHT: (0, 1),
        Direction.FORWARD: (-1, 0),
        Direction.BACKWARD: (1, 0)
    }

    marble_idx_table = {
        Marble.BLACK: 0,
        Marble.WHITE: 1,
        Marble.RED: 2
    }

    @classmethod
    def get_vector(cls, direction):
        """
        Looks up a direction in the vector table and returns the vector

        :param direction: the input direction
        :return: a vector in the given direction
        """
        return cls.vector_table[direction]

    @classmethod
    def get_marble_idx(cls, marble):
        """
        Converts marble to a number
        Used to access hash keys

        :param marble: the input marble
        :return: a index number
        """
        return cls.marble_idx_table[marble]

    @staticmethod
    def init_board():
        """
        Returns the initial game board as a 2D matrix
        """
        X, B, W, R = Marble.EMPTY, Marble.BLACK, Marble.WHITE, Marble.RED
        return [[W, W, X, X, X, B, B],
                [W, W, X, R, X, B, B],
                [X, X, R, R, R, X, X],
                [X, R, R, R, R, R, X],
                [X, X, R, R, R, X, X],
                [B, B, X, R, X, W, W],
                [B, B, X, X, X, W, W]]

    @staticmethod
    def init_hash(bit=32):
        """
        Returns a table of random keys to a kuba board

        :param bit: length of the keys, default 32
        :return: a nested list of random keys
        """
        return [[[random.getrandbits(bit),
                  random.getrandbits(bit),
                  random.getrandbits(bit)] for col in row] for row in GameUtil.init_board()]

    @staticmethod
    # TODO: rework this part
    def init_captures(p1, p2):
        p1_name, p1_color = p1
        p2_name, p2_color = p2

        return {p1_name: {'name': p1_name,
                          'color': p1_color,
                          'captured': 0, },
                p2_name: {'name': p2_name,
                          'color': p2_color,
                          'captured': 0}}

    @staticmethod
    def hash_board(game_board, hash_table):
        """
        Given a Kuba board and a table of hash keys,
        returns a hash of the board's state

        :param game_board: the input Kuba board
        :param hash_table: the table of keys
        :return: a hash value
        """
        board_hash = 0
        for i, row in enumerate(game_board):
            for j, marble in enumerate(row):
                if marble != Marble.EMPTY:
                    marble_idx = GameUtil.get_marble_idx(marble)
                    board_hash ^= hash_table[i][j][marble_idx]
        return board_hash

    @staticmethod
    def is_off_board(pos):
        row, col = pos
        if row < 0 or row > 6 or col < 0 or col > 6:
            return True
        return False

    @staticmethod
    def count_marbles(game_board):
        counts = [0, 0, 0]
        for marble in flatten(game_board):
            if marble == Marble.WHITE:
                counts[0] += 1
            elif marble == Marble.BLACK:
                counts[1] += 1
            elif marble == Marble.RED:
                counts[2] += 1
        return tuple(counts)

    @staticmethod
    def get_next(pos, direction):
        """
        Given a position on a Kuba board and a direction,
        returns the next position in the direction

        :param pos: a position on a Kuba board
        :param direction: a direction vector
        :return: the next position
        """
        return sum_vector(pos, GameUtil.get_vector(direction))

    @staticmethod
    def get_prev(pos, direction):
        """
        Given a position on a Kuba board and a direction,
        returns the next position in the opposite direction

        :param pos: a position on a Kuba board
        :param direction: a direction vector
        :return: the previous position
        """
        return sum_vector(pos, negate_vector(GameUtil.get_vector(direction)))


def negate_vector(vector):
    """
    Returns a new vector with each value negated

    :param vector: the input vector
    :return: a new vector in the opposite direction of the input vector
    """
    return tuple(-x for x in vector)


def sum_vector(*vectors):
    """
    Returns a new vector that is the sum of multiple vectors

    :param vectors: tuple vectors
    :return: a new vector that is the sum of the input vectors
    """
    return tuple(sum(x) for x in zip(*vectors))


def flatten(a_list):
    """
    Flatten a 2d list into a flat list

    :param a_list: the input 2d list
    :return: the flattened list
    """
    return [i for sub in a_list for i in sub]


class KubaGame:
    def __init__(self, player_1, player_2):
        self._players = (player_1[0], player_2[0])
        self._captures = GameUtil.init_captures(player_1, player_2)
        self._board = GameUtil.init_board()
        self._current_turn = None
        self._parity = 0
        self._winner = None
        self._turns = 1
        self._hash_table = GameUtil.init_hash()
        self._prev_marble_count = GameUtil.count_marbles(self._board)
        self._cur_hash = GameUtil.hash_board(self._board, self._hash_table)
        self._prev_hash = self._cur_hash

    def get_current_turn(self):
        """
        Returns the player name whose turn it is to play the game.
        Returns None if it's the first turn

        :return: the player name whose turn it is to play the game
        """
        return self._current_turn

    def get_winner(self):
        """
        Returns the winner if there is one

        :return: the name of the winner or None
        """
        return self._winner

    def get_marble_count(self):
        """
        Returns the amount of each kind of marble on the board
        in the form of a tuple(W,B,R)

        :return: a tuple containing the amount of marbles on the board
        """
        return GameUtil.count_marbles(self._board)

    def get_captured(self, player_name):
        """
        Return the number of red marbles captured by a player

        :param player_name: the input player name
        :return: number of red marbles captured by the player
        """
        return self._captures[player_name]['captured']

    def make_move(self, player_name, pos, direction):
        """
        Make a move on the board.
        Returns True if the move is made successfully, otherwise False.

        :param player_name: the name of the player making the move
        :param pos: the position of the starting marble
        :param direction: the direction of the move
        :return: a boolean value indicating if the move is successful
        """
        series = self.get_series(pos, direction)

        try:
            new_hash = self.try_move(pos, direction, series, player_name)
        except (InvalidMove, KeyError, IndexError):
            return False

        self.propagate_move(direction, series)

        # update hash
        self._prev_hash, self._cur_hash = self._cur_hash, new_hash

        # does not implement the "extra turns" rule
        self._turns += 1
        self._current_turn = self.get_other_player(player_name)

        # update marble count
        marbles = self.get_marble_count()
        white, black, red = marbles

        self._captures[player_name]['captured'] += self._prev_marble_count[-1] - red
        self._prev_marble_count = marbles

        # assume the current player has non-zero marbles
        if 0 in marbles or self._captures[player_name]['captured'] >= 7:
            self._winner = player_name

        self.print()
        return True

    def try_move(self, pos, direction, series, player):
        """
        Attempt to make a move
        Raises InvalidMove is move cannot be made

        :param pos: position of the pushed marble
        :param direction: direction of the move
        :param series: the list of marbles moved
        :param player: the player making the move
        :return: the resulting hash of the move
        """
        # empty series will throw error
        last_pos = series[0]
        to_pos = GameUtil.get_next(last_pos, direction)
        # check winner
        if self._winner:
            raise InvalidMove('game over')
        # check turn
        elif self._current_turn is not None and self._current_turn != player:
            raise InvalidMove('wrong player')
        # check piece belongs to player and is not empty
        elif self._captures[player]['color'] != self.get_marble(pos):
            raise InvalidMove('wrong piece')
        # check direction is valid
        elif self.get_marble(GameUtil.get_prev(pos, direction)) != Marble.EMPTY:
            raise InvalidMove('invalid direction')
        # check not pushing off own marble
        elif GameUtil.is_off_board(to_pos) and self.get_marble(last_pos) == self.get_marble(pos):
            raise InvalidMove('cannot push off own marble')
        # check not undoing opponent's move
        else:
            new_hash = self.simulate_move(direction, series)
            if new_hash == self._prev_hash:
                raise InvalidMove('cannot undo move')
            return new_hash

    def get_other_player(self, player_name):
        """
        Returns the player other than the given player

        :param player_name: the current player's name
        :return: the other player's name
        """
        # set parity on first turn
        if self._current_turn is None:
            if player_name == self._players[0]:
                self._parity = 1
            else:
                self._parity = 0
        return self._players[(self._turns + self._parity) % 2]

    def get_series(self, pos, direction, res=None):
        """
        Returns the list of positions of marbles that is affected by a move
        The last marble is the first first in the list, and the first (pushed) marble
        is the last item

        :param pos: position of the pushed marble
        :param direction: direction of the move
        :param res: the list to be returned
        :return: a list of positions of marbles that is affected by a move
        """
        if res is None:
            res = []
        marble = self.get_marble(pos)
        if marble == Marble.EMPTY:
            return res
        else:
            return self.get_series(GameUtil.get_next(pos, direction), direction, [pos, *res])

    def simulate_move(self, direction, series):
        """
        Simulate a move by computing the hash of the resulting board
        Hopefully no collisions

        :param direction: direction of the move
        :param series: list of the marbles moved
        :return: the hash of the resulting board
        """
        sim_hash = self._cur_hash
        for pos in series:
            marble_id = GameUtil.get_marble_idx(self.get_marble(pos))
            to_pos = GameUtil.get_next(pos, direction)
            # xor the modified positions
            if GameUtil.is_off_board(to_pos):
                sim_hash ^= self._hash_table[pos[0]][pos[1]][marble_id]
            else:
                sim_hash ^= self._hash_table[pos[0]][pos[1]][marble_id] ^ \
                            self._hash_table[to_pos[0]][to_pos[1]][marble_id]
        return sim_hash

    def propagate_move(self, direction, series):
        """
        Apply a move to a series of marbles to the board

        :param direction: direction of the move
        :param series: the list of marbles that will be moved
        """
        for pos in series:
            to_pos = GameUtil.get_next(pos, direction)
            marble = self.get_marble(pos)
            self.set_marble(to_pos, marble)
        # manually empty the starting position
        self.set_marble(series[-1], Marble.EMPTY)

    def set_marble(self, pos, marble):
        """
        Set a marble at a position

        :param pos: the position to set
        :param marble: the marble to set
        """
        row, col = pos
        if GameUtil.is_off_board(pos):
            return
        try:
            self._board[row][col] = marble
        except IndexError:
            return

    def get_marble(self, pos):
        """
        Gets the marble at a position
        Returns the empty marble 'X' if position is not valid

        :param pos: the position to get from
        :return: the marble at the given position
        """
        row, col = pos
        if GameUtil.is_off_board(pos):
            return Marble.EMPTY
        # this probably will not throw
        try:
            return self._board[row][col]
        except IndexError:
            return Marble.EMPTY

    def print(self):
        """
        Prints the state of the game
        """
        state_val = list(self._captures.values())
        p1 = state_val[0]["name"]
        p2 = state_val[1]["name"]
        print('-------------------')
        print(f'Turn: {self._turns - 1}')
        print(f'Next move: {self._current_turn}')
        print(f'Marble counts: {self.get_marble_count()}')
        print(
            f'Captured: {p1}: {self.get_captured(p1)}, '
            f'{p2}: {self.get_captured(p2)}')
        for row in self._board:
            print('  '.join(row))
        print('-------------------')
