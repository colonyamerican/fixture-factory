.PHONY: clean build init setup-hooks lint test test-watch

clean:
	rm -rf ./dist

init:
	make install
	make setup-hooks

install:
	./scripts/install.sh

setup-hooks:
	./scripts/setup-hooks.sh

build:
	make clean
	./scripts/build.sh

watch:
	make clean
	./scripts/watch.sh

lint:
	./scripts/lint.sh

test:
	./scripts/test.sh

test-watch:
	./scripts/test.watch.sh
